import sqlite from './sqlite';
import { LocalNotifications } from '@capacitor/local-notifications';

type PollOptions = {
  intervalMs?: number;
  lookaheadMin?: number;
};

class NotificationService {
  private static _instance: NotificationService | null = null;
  private timer: any = null;

  static getInstance(): NotificationService {
    if (!NotificationService._instance) NotificationService._instance = new NotificationService();
    return NotificationService._instance;
  }

  async ensureTable() {
    try {
      await sqlite.executeSql(`CREATE TABLE IF NOT EXISTS HabitNotifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habitId INTEGER NOT NULL,
        date TEXT NOT NULL,
        notifiedAt TEXT DEFAULT (datetime('now'))
      );`);
    } catch (e) {
      console.warn('ensureTable HabitNotifications failed', e);
    }
  }

  start(opts: PollOptions = {}) {
    const intervalMs = opts.intervalMs ?? 60_000; // default 1 minute
    const lookaheadMin = opts.lookaheadMin ?? 10; // default 10 minutes

    if (this.timer) clearInterval(this.timer);

    // run immediately then set interval
    this.checkOnce(lookaheadMin).catch(() => {});
    this.timer = setInterval(() => this.checkOnce(lookaheadMin).catch(() => {}), intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async checkOnce(lookaheadMin: number) {
    try {
      await this.ensureTable();

      // respect session: only notify when a user is logged in
      const sid = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userId') : null;
      const userId = sid ? Number(sid) : null;
      if (!userId) return;

      const now = new Date();
      const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

      // fetch today's habits with a time set and not done
      const rows: any[] = await sqlite.querySql(`SELECT * FROM Habits WHERE createdBy = ? AND createdAt LIKE ? AND time IS NOT NULL AND isDone = 0`, [userId, today + '%']);
      if (!rows || rows.length === 0) return;

      for (const h of rows) {
        const timeStr = String(h.time || '');
        const parts = timeStr.split(':');
        if (parts.length < 2) continue;
        const hh = Number(parts[0]);
        const mm = Number(parts[1]);

        const when = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0);
        const diffMin = (when.getTime() - now.getTime()) / 60000;
        if (diffMin >= 0 && diffMin <= lookaheadMin) {
          // check if already notified for this habit on this date
          const already = await sqlite.querySql('SELECT * FROM HabitNotifications WHERE habitId = ? AND date = ?', [h.id, today]);
          if (already && already.length > 0) continue;

          // mark notified
          await sqlite.executeSql('INSERT INTO HabitNotifications (habitId, date) VALUES (?,?)', [h.id, today]);

          // dispatch in-app event immediately so users of the app get an immediate toast/reminder
          try {
            window.dispatchEvent(new CustomEvent('habit-notification', { detail: { habit: h } }));
          } catch (err) {
            console.warn('dispatch habit-notification failed', err);
          }

          // try to send native local notification scheduled at the exact time
          try {
            await LocalNotifications.requestPermissions();
            await LocalNotifications.schedule({
              notifications: [
                {
                  id: Number(h.id) || Date.now(),
                  title: 'Recordatorio de hábito',
                  body: `${h.name} a las ${h.time}`,
                  schedule: { at: when },
                }
              ]
            });
          } catch (e) {
            // scheduling failed — we already dispatched in-app event as fallback
            console.warn('LocalNotifications schedule failed', e);
          }
        }
      }
    } catch (err) {
      console.warn('Notification check failed', err);
    }
  }
}

const notificationService = NotificationService.getInstance();
export default notificationService;
