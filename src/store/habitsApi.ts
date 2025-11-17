import sqlite from '../services/sqlite';
import { createApi } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, QueryReturnValue } from '@reduxjs/toolkit/query';

// Domain types
export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  status?: number;
}

export interface Habit {
  id: number;
  name: string;
  categoryId?: number | null;
  time?: string | null;
  isDone: number;
  createdAt?: string;
  createdBy?: number;
}

const dummyBaseQuery = (async (): Promise<any> => ({ data: null })) as BaseQueryFn<unknown, unknown, unknown>;

export const habitsApi = createApi({
  reducerPath: 'habitsApi',
  tagTypes: ['Habits', 'Categories'],
  baseQuery: dummyBaseQuery,
  endpoints: (builder) => ({
    getAllCategories: builder.query<Category[], void>({
      async queryFn(): Promise<QueryReturnValue<Category[], unknown, object | undefined>> {
        try {
          const rows = (await sqlite.querySql('SELECT * FROM Categories ORDER BY id')) as Category[];
          return { data: rows };
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: ['Categories']
    }),

    createHabit: builder.mutation<Habit | null, { name: string; categoryId?: number; time?: string }>(
      {
        async queryFn({ name, categoryId, time }): Promise<QueryReturnValue<Habit | null, unknown, object | undefined>> {
          try {
            await sqlite.executeSql('INSERT INTO Habits (name, categoryId, time, isDone, createdBy) VALUES (?,?,?,?,?)', [name, categoryId ?? null, time ?? null, 0, 1]);
            const rows = (await sqlite.querySql('SELECT * FROM Habits ORDER BY id DESC LIMIT 1')) as Habit[];
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error: error as unknown };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    updateHabit: builder.mutation<Habit | null, { id: number; name: string; categoryId?: number; time?: string }>(
      {
        async queryFn({ id, name, categoryId, time }): Promise<QueryReturnValue<Habit | null, unknown, object | undefined>> {
          try {
            await sqlite.executeSql('UPDATE Habits SET name = ?, categoryId = ?, time = ? WHERE id = ?', [name, categoryId ?? null, time ?? null, id]);
            const rows = (await sqlite.querySql('SELECT * FROM Habits WHERE id = ?', [id])) as Habit[];
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
            const rows = (await sqlite.querySql('SELECT * FROM Habits WHERE id = ?', [id])) as Habit[];
            return { data: rows[0] ?? null };
          } catch (error) {
            return { error: error as unknown };
          }
        },
        invalidatesTags: ['Habits']
      }
    ),

    getAllHabits: builder.query<Habit[], void>({
      async queryFn(): Promise<QueryReturnValue<Habit[], unknown, object | undefined>> {
        try {
          const rows = (await sqlite.querySql('SELECT * FROM Habits ORDER BY createdAt DESC')) as Habit[];
          console.log({rows});
          return { data: rows};
        } catch (error) {
          return { error: error as unknown };
        }
      },
      providesTags: ['Habits']
    }),

    getProgress: builder.query<{ percentage: number; today: Habit[] }, void>({
      async queryFn(): Promise<QueryReturnValue<{ percentage: number; today: Habit[] }, unknown, object | undefined>> {
        try {
          const all = (await sqlite.querySql('SELECT * FROM Habits')) as Habit[];

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
  useGetProgressQuery
} = habitsApi;
