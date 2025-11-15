import { configureStore } from '@reduxjs/toolkit';
import { sqlApi } from './sqlApi';

export const store = configureStore({
  reducer: {
    [sqlApi.reducerPath]: sqlApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(sqlApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
