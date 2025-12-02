import sqlite from '../services/sqlite';
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, QueryReturnValue } from '@reduxjs/toolkit/query';
import { Habit, HabitCompletion } from '../types/Habits.types';
import { Category } from '../types/Categories.types';

const dummyBaseQuery = (async (): Promise<any> => ({ data: null })) as BaseQueryFn<unknown, unknown, unknown>;

export const habitsApi = createApi({
  reducerPath: 'habitsApi',
  tagTypes: ['Habits', 'Categories', 'Users'],
  baseQuery: dummyBaseQuery,
  endpoints: (builder) => ({
    // --- Users endpoints ---
    getUser: builder.query<any, number | void>({
      async queryFn(id?: number): Promise<QueryReturnValue<any, unknown, object | undefined>> {
        try {
          if (!id) return { data: null };
          // ensure sqlite initialized (safe to call multiple times)
          const rows: any[] = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [id]);
          return { data: rows && rows[0] ? rows[0] : null };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: (result, error, id) => (id ? [{ type: 'Users', id }] : ['Users'])
    }),

    createUser: builder.mutation<any, { email: string; password: string; fullname: string }>({
      async queryFn({ email, password, fullname }): Promise<QueryReturnValue<any, unknown, object | undefined>> {
        try {
          await sqlite.executeSql('INSERT INTO Users (email, password, fullname) VALUES (?,?,?)', [email, password, fullname]);
          const rows = await sqlite.querySql('SELECT * FROM Users WHERE email = ? LIMIT 1', [email]);
          return { data: rows && rows[0] ? rows[0] : null };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      invalidatesTags: ['Users']
    }),

    loginUser: builder.mutation<any, { email: string; password: string }>({
      async queryFn({ email, password }): Promise<QueryReturnValue<any, unknown, object | undefined>> {
        try {
          const rows = await sqlite.querySql('SELECT * FROM Users WHERE email = ? LIMIT 1', [email]);
          if (!rows || rows.length === 0) return { data: null };
          const u = rows[0];
          if (String(u.password) !== String(password)) return { data: null };
          return { data: u };
        } catch (error) {
          return { error: error as unknown };
        }
      }
    }),

    updateUser: builder.mutation<any, { id: number; fullname?: string | null; birthDate?: string | null; weight?: number | null; age?: number | null }>({
      async queryFn({ id, fullname, birthDate, weight, age }): Promise<QueryReturnValue<any, unknown, object | undefined>> {
        try {
          await sqlite.executeSql('UPDATE Users SET fullname = ?, birthDate = ?, weight = ?, age = ? WHERE id = ?', [fullname ?? null, birthDate ?? null, weight ?? null, age ?? null, id]);
          const rows = await sqlite.querySql('SELECT * FROM Users WHERE id = ? LIMIT 1', [id]);
          return { data: rows && rows[0] ? rows[0] : null };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      invalidatesTags: (result, error, { id }) => [{ type: 'Users', id }]
    }),

    getAllCategories: builder.query<Category[], void>({
        async queryFn(): Promise<QueryReturnValue<Category[], unknown, object | undefined>> {
          try {
            const rows: Category[] = await sqlite.querySql('SELECT * FROM Categories ORDER BY id');
            return { data: rows };
          } catch (error) {
            return { error: error as unknown };
          }
        },
      providesTags: ['Categories']
    }),

    createHabit: builder.mutation<Habit, Omit<Habit, "id" | "completions"> & { createdAt?: string }>(
      {
        async queryFn({ name, categoryId, time, description, frequency, createdAt }): Promise<QueryReturnValue<Habit, Omit<Habit, "id" | "completions"> | unknown, object | undefined>> {
          try {
            const sid = sessionStorage.getItem('userId');
            const userId = sid ? Number(sid) : null;
            if (!userId) {
              return { error: new Error('No session userId') } as any;
            }
            // get category icon if available
            let icon: string | null = null;
            if (categoryId) {
              const cats = await sqlite.querySql('SELECT icon FROM Categories WHERE id = ?', [categoryId]);
              icon = (cats[0] && cats[0].icon) || null;
            }

            if (createdAt) {
              await sqlite.executeSql('INSERT INTO Habits (name, description, frequency, categoryId, time, icon, isDone, createdBy, createdAt) VALUES (?,?,?,?,?,?,?,?,?)', [name, description ?? null, frequency ?? 'daily', categoryId ?? null, time ?? null, icon, 0, userId, createdAt]);
            } else {
              await sqlite.executeSql('INSERT INTO Habits (name, description, frequency, categoryId, time, icon, isDone, createdBy) VALUES (?,?,?,?,?,?,?,?)', [name, description ?? null, frequency ?? 'daily', categoryId ?? null, time ?? null, icon, 0, userId]);
            }
            const rows : Habit[] = await sqlite.querySql('SELECT * FROM Habits ORDER BY id DESC LIMIT 1');
            return { data: rows?.[0] ?? null };
          } catch (error) {
            return { error: error as unknown };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    updateHabit: builder.mutation<Habit | null, { id: number; name: string; categoryId?: number; time?: string; description?: string; frequency?: string }>(
      {
        async queryFn({ id, name, categoryId, time, description, frequency }): Promise<QueryReturnValue<Habit | null, unknown, object | undefined>> {
          try {
            // get icon for category
            let icon: string | null = null;
            if (categoryId) {
              const cats = await sqlite.querySql('SELECT icon FROM Categories WHERE id = ?', [categoryId]);
              icon = (cats[0] && cats[0].icon) || null;
            }

            await sqlite.executeSql('UPDATE Habits SET name = ?, description = ?, frequency = ?, categoryId = ?, time = ?, icon = ? WHERE id = ?', [name, description ?? null, frequency ?? 'daily', categoryId ?? null, time ?? null, icon, id]);
            const rows: Habit[] = await sqlite.querySql('SELECT * FROM Habits WHERE id = ?', [id]);
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error: error as unknown };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    completeHabit: builder.mutation<Habit | null, { id: number }>(
      {
        async queryFn({ id }): Promise<QueryReturnValue<Habit | null, unknown, object | undefined>> {
          try {
            await sqlite.executeSql('UPDATE Habits SET isDone = 1 WHERE id = ?', [id]);
            const rows: Habit[] = await sqlite.querySql('SELECT * FROM Habits WHERE id = ?', [id]);
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error: error as unknown };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    // optionally pass a date string (YYYY-MM-DD) to filter habits created on that date
    getAllHabits: builder.query<Habit[], { createdDate?: string; userId?: number } | void>({
      async queryFn(arg?: { createdDate?: string; userId?: number }): Promise<QueryReturnValue<Habit[], unknown, object | undefined>> {
        try {
          const sid = sessionStorage.getItem('userId');
          const sessionUserId = sid ? Number(sid) : null;
          const userId = (arg && arg.userId) || sessionUserId;
          if (!userId) return { data: [] } as any;
          // Get habits (optionally filter by creation date)
          const createdDate = arg?.createdDate;
          let habits: Habit[] = [];
          if (createdDate) {
            habits = await sqlite.querySql(`SELECT * FROM Habits WHERE createdBy = ? AND createdAt LIKE ? ORDER BY createdAt DESC`, [userId, `${createdDate}%`]);
          } else {
            habits = await sqlite.querySql(`SELECT * FROM Habits WHERE createdBy = ? ORDER BY createdAt DESC`, [userId]);
          }

          // fetch completions for these habits
          const ids = habits.map(h => h.id).filter(Boolean);
          let completions: HabitCompletion[] = [];
          if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const rawComps = await sqlite.querySql(`SELECT * FROM HabitCompletions WHERE habitId IN (${placeholders})`, ids as string[]);
            completions = Array.isArray(rawComps) ? rawComps : []
          }

          // attach completions to each habit
          const habitMap: Record<number, HabitCompletion[]> = {};
          completions.forEach(c => {
            const hid = Number(c.habitId);
            habitMap[hid] = habitMap[hid] || [];
            habitMap[hid].push({
              habitId: c.habitId,
              id: String(c.id), 
              date: c.date, 
              completed: Number(c.completed) === 1 
            });
          });

          const enriched = habits.map(h => ({ ...h, completions: habitMap[Number(h.id)] || [] }));
          return { data: enriched };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: ['Habits']
    }),

    // Habits created today and still pending, ordered by time (null times go last)
    getTodaysHabits: builder.query<Habit[], number | void>({
      async queryFn(arg?: number): Promise<QueryReturnValue<Habit[], unknown, object | undefined>> {
        try {
          const sid = sessionStorage.getItem('userId');
          const sessionUserId = sid ? Number(sid) : null;
          const userId = arg ?? sessionUserId;
          if (!userId) return { data: [] } as any;
          const now = new Date();
          const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
          const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

          // select habits created today and not yet done, order by time (non-null first)
          const habits: Habit[] = await sqlite.querySql(`SELECT * FROM Habits WHERE createdBy = ? AND createdAt LIKE ? AND isDone = 0 ORDER BY (time IS NULL), time ASC`, [userId, `${today}%`]);

          // attach completions for these habits
          const ids = habits.map(h => h.id).filter(Boolean);
          let completions: HabitCompletion[] = [];
          if (ids.length > 0) {
            const placeholders = ids.map(() => '?').join(',');
            const rawComps = await sqlite.querySql(`SELECT * FROM HabitCompletions WHERE habitId IN (${placeholders})`, ids as string[]);
            completions = Array.isArray(rawComps) ? rawComps : [];
          }

          const habitMap: Record<number, HabitCompletion[]> = {};
          completions.forEach(c => {
            const hid = Number(c.habitId);
            habitMap[hid] = habitMap[hid] || [];
            habitMap[hid].push({
              habitId: c.habitId,
              id: String(c.id),
              date: c.date,
              completed: Number(c.completed) === 1
            });
          });

          const enriched = habits.map(h => ({ ...h, completions: habitMap[Number(h.id)] || [] }));
          return { data: enriched };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: ['Habits'],
    }),

    // Today's summary: total habits created today and how many are completed (based on HabitCompletions for today's date)
    getTodayProgress: builder.query<{ percentage: number; total: number; completed: number }, number | void>({
      async queryFn(arg?: number): Promise<QueryReturnValue<{ percentage: number; total: number; completed: number }, unknown, object | undefined>> {
        try {
          const sid = sessionStorage.getItem('userId');
          const sessionUserId = sid ? Number(sid) : null;
          const userId = arg ?? sessionUserId;
          if (!userId) return { data: { percentage: 0, total: 0, completed: 0 } } as any;
          const now = new Date();
          const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
          const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

          const todaysHabits: Habit[] = await sqlite.querySql(`SELECT * FROM Habits WHERE createdBy = ? AND createdAt LIKE ?`, [userId, `${today}%`]);
          const total = todaysHabits.length;
          let completed = 0;
          if (total > 0) {
            const ids = todaysHabits.map(h => h.id).filter(Boolean);
            const placeholders = ids.map(() => '?').join(',');
            const rows = await sqlite.querySql(`SELECT DISTINCT habitId FROM HabitCompletions WHERE habitId IN (${placeholders}) AND date = ?`, [...(ids as string[]), today]);
            // rows may be array of objects with habitId
            completed = Array.isArray(rows) ? rows.length : 0;
          }
          const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
          return { data: { percentage, total, completed } };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: ['Habits']
    }),

    // delete habit
    deleteHabit: builder.mutation<void, { id: number }>({
      async queryFn({ id }): Promise<QueryReturnValue<void, unknown, object | undefined>> {
        try {
          const sid = sessionStorage.getItem('userId');
          const userId = sid ? Number(sid) : null;
          if (!userId) return { data: undefined } as any;
          await sqlite.executeSql('DELETE FROM HabitCompletions WHERE habitId = ?', [id]);
          await sqlite.executeSql('DELETE FROM Habits WHERE id = ? AND createdBy = ?', [id, userId]);
          return { data: undefined };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      invalidatesTags: ['Habits']
    }),

    // add a completion (date string YYYY-MM-DD)
    addCompletion: builder.mutation<void, { habitId: number; date: string }>({
      async queryFn({ habitId, date }): Promise<QueryReturnValue<void, unknown, object | undefined>> {
        try {
          await sqlite.executeSql('INSERT INTO HabitCompletions (habitId, date, completed) VALUES (?,?,1)', [habitId, date]);
          return { data: undefined };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      invalidatesTags: ['Habits']
    }),

    // remove a completion
    removeCompletion: builder.mutation<void, { habitId: number; date: string }>({
      async queryFn({ habitId, date }): Promise<QueryReturnValue<void, unknown, object | undefined>> {
        try {
          await sqlite.executeSql('DELETE FROM HabitCompletions WHERE habitId = ? AND date = ?', [habitId, date]);
          return { data: undefined };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      invalidatesTags: ['Habits']
    }),

    getProgress: builder.query<{ percentage: number; today: Habit[] }, void>({
      async queryFn(): Promise<QueryReturnValue<{ percentage: number; today: Habit[] }, unknown, object | undefined>> {
        try {
          const sid = sessionStorage.getItem('userId');
          const userId = sid ? Number(sid) : null;
          if (!userId) return { data: { percentage: 0, today: [] } } as any;
          const all = (await sqlite.querySql('SELECT * FROM Habits WHERE createdBy = ?', [userId])) as Habit[];

          // compute today's date prefix (YYYY-MM-DD)
          const now = new Date();
          const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
          const todayPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

          const today = all.filter((h) => {
            if (!h.createdAt) return false;
            return String(h.createdAt).startsWith(todayPrefix);
          });

          const total = today.length;
          const done = today.filter((h) => Number(h.isDone) === 1).length;
          const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

          return { data: { percentage, today } };
        } catch (error) {
          return { error: error as unknown };
        }
      }
    })
  })
});

export const {
  useGetAllCategoriesQuery,
  useCreateHabitMutation,
  useUpdateHabitMutation,
  useCompleteHabitMutation,
  useGetAllHabitsQuery,
  useGetTodaysHabitsQuery,
  useGetTodayProgressQuery,
  useGetProgressQuery,
  useDeleteHabitMutation,
  useAddCompletionMutation,
  useRemoveCompletionMutation,
  useGetUserQuery,
  useCreateUserMutation,
  useLoginUserMutation,
  useUpdateUserMutation,
} = habitsApi;
