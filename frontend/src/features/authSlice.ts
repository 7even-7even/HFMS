import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IUser } from '../types';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialToken = localStorage.getItem('hfms_token');
const initialUser = localStorage.getItem('hfms_user')
  ? JSON.parse(localStorage.getItem('hfms_user') as string)
  : null;

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken && !!initialUser,
  isLoading: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: IUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('hfms_token', action.payload.token);
      localStorage.setItem('hfms_user', JSON.stringify(action.payload.user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('hfms_token');
      localStorage.removeItem('hfms_user');
    },
    updateUser(state, action: PayloadAction<IUser>) {
      state.user = action.payload;
      localStorage.setItem('hfms_user', JSON.stringify(action.payload));
    },
  },
});

export const { loginSuccess, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;
