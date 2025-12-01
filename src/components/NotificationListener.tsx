import React, { useEffect, useState } from 'react';
import { IonToast } from '@ionic/react';
import { LocalNotifications } from '@capacitor/local-notifications';

const NotificationListener: React.FC = () => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // handler for the in-app fallback event dispatched by the notification service
    const handler = (e: any) => {
      const h = e?.detail?.habit;
      if (!h) return;
      setMessage(`${h.name} a las ${h.time}`);
      setShow(true);
    };

    window.addEventListener('habit-notification', handler as EventListener);

    let removeReceived: (() => void) | null = null;
    let removeAction: (() => void) | null = null;

    // Try to attach native LocalNotifications listeners if plugin is available.
    (async () => {
      try {
        // add listener for notification received while app is in foreground
        const received = LocalNotifications.addListener('localNotificationReceived', (notif: any) => {
          try {
            const data = notif?.notification?.extra?.data || notif?.notification || notif;
            const title = notif?.notification?.title || (data && data.title) || 'Recordatorio';
            const body = notif?.notification?.body || (data && data.body) || '';
            setMessage(`${title} — ${body}`);
            setShow(true);
          } catch (err) {
            // best-effort
            setMessage('Tienes un recordatorio');
            setShow(true);
          }
        });
        removeReceived = () => received.remove();

        // add listener for when the user taps the notification
        const action = LocalNotifications.addListener('localNotificationActionPerformed', (payload: any) => {
          try {
            const notif = payload?.notification || payload;
            const title = notif?.title || 'Recordatorio';
            const body = notif?.body || '';
            setMessage(`${title} — ${body}`);
            setShow(true);
          } catch (err) {
            setMessage('Notificación pulsada');
            setShow(true);
          }
        });
        removeAction = () => action.remove();
      } catch (e) {
        // plugin not available or failed to attach — that's fine, window fallback will work
        // console.debug('LocalNotifications listeners not attached', e);
      }
    })();

    return () => {
      window.removeEventListener('habit-notification', handler as EventListener);
      if (removeReceived) removeReceived();
      if (removeAction) removeAction();
    };
  }, []);

  return (
    <IonToast isOpen={show} message={message} duration={6000} onDidDismiss={() => setShow(false)} />
  );
};

export default NotificationListener;
