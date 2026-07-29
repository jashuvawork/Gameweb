import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';

type AuthUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  coins: number;
  credits: number;
  subscription: string;
  twoFactorEnabled?: boolean;
} | null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null as AuthUser,
    accessToken: null as string | null,
    ready: false,
  },
  reducers: {
    setAuth(state, action: PayloadAction<{ user: AuthUser; accessToken: string | null }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.ready = true;
    },
    clearAuth(state) {
      state.user = null;
      state.accessToken = null;
      state.ready = true;
    },
    hydrate(state) {
      if (typeof window === 'undefined') return;
      const token = localStorage.getItem('jg_access');
      const user = localStorage.getItem('jg_user');
      state.accessToken = token;
      state.user = user ? JSON.parse(user) : null;
      state.ready = true;
    },
  },
});

const uiSlice = createSlice({
  name: 'ui',
  initialState: { search: '', genre: '', audioEnabled: false },
  reducers: {
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    setGenre(state, action: PayloadAction<string>) {
      state.genre = action.payload;
    },
    setAudio(state, action: PayloadAction<boolean>) {
      state.audioEnabled = action.payload;
    },
  },
});

export const { setAuth, clearAuth, hydrate } = authSlice.actions;
export const { setSearch, setGenre, setAudio } = uiSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    ui: uiSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
