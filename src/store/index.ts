import { configureStore } from '@reduxjs/toolkit';
import { habitsApi } from './habitsApi';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [habitsApi.reducerPath]: habitsApi.reducer
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(habitsApi.middleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
