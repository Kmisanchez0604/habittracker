import { createApi } from '@reduxjs/toolkit/query/react';
import { executeSql, querySql } from '../services/sqlite';

// Using a dummy baseQuery because endpoints use queryFn directly to talk to SQLite
export const habitsApi = createApi({
  reducerPath: 'habitsApi',
  tagTypes: ['Habits', 'Categories'],
  baseQuery: async () => ({ data: null }) as any,
  endpoints: (builder) => ({
    getAllCategories: builder.query<any[], void>({
      async queryFn() {
        try {
          const rows = await querySql('SELECT * FROM Categories ORDER BY id');
          return { data: rows, };
        } catch (error) {
          return { error };
        }
      }
      ,
      providesTags: ['Categories']
    }),

    createHabit: builder.mutation<any, { name: string; categoryId?: number; time?: string }>(
      {
        async queryFn({ name, categoryId, time }) {
          try {
            await executeSql('INSERT INTO Habits (name, categoryId, time, isDone, createdBy) VALUES (?,?,?,?,?)', [name, categoryId ?? null, time ?? null, 0, 1]);
            const rows = await querySql('SELECT * FROM Habits ORDER BY id DESC LIMIT 1');
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    updateHabit: builder.mutation<any, { id: number; name: string; categoryId?: number; time?: string }>(
      {
        async queryFn({ id, name, categoryId, time }) {
          try {
            await executeSql('UPDATE Habits SET name = ?, categoryId = ?, time = ? WHERE id = ?', [name, categoryId ?? null, time ?? null, id]);
            const rows = await querySql('SELECT * FROM Habits WHERE id = ?', [id]);
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    completeHabit: builder.mutation<any, { id: number }>(
      {
        async queryFn({ id }) {
          try {
            await executeSql('UPDATE Habits SET isDone = 1 WHERE id = ?', [id]);
            const rows = await querySql('SELECT * FROM Habits WHERE id = ?', [id]);
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    getAllHabits: builder.query<any[], void>({
      async queryFn() {
        try {
          const rows = await querySql('SELECT * FROM Habits ORDER BY createdAt DESC');
          return { data: rows };
        } catch (error) {
          return { error };
        }
      },
      providesTags: ['Habits']
    }),

    getProgress: builder.query<{ percentage: number; today: any[] }, void>({
      async queryFn() {
        try {
          const all: any[] = await querySql('SELECT * FROM Habits');

          // compute today's date prefix (YYYY-MM-DD)
          const now = new Date();
          const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
          const todayPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

          const today = all.filter((h) => {
            if (!h.createdAt) return false;
            // createdAt stored as "YYYY-MM-DD HH:MM:SS" or similar — check prefix
            return String(h.createdAt).startsWith(todayPrefix);
          });

          const total = today.length;
          const done = today.filter((h) => Number(h.isDone) === 1).length;
          const percentage = total === 0 ? 0 : Math.round((done / total) * 100);

          return { data: { percentage, today } };
        } catch (error) {
          return { error };
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
  useGetProgressQuery
} = habitsApi;
