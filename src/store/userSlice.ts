import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  id?: number;
  email?: string;
  fullname?: string | null;
  birthDate?: string | null;
  weight?: number | null;
}

const initialState: UserState = {};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserState>) {
      return { ...state, ...action.payload };
    },
    clearUser() {
      return {} as UserState;
    }
  }
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;
