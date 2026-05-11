import { createStore } from '@alphacifer/react/zustand';
import type { TUserEntity } from '@domain/auth';

interface ISetAuthParams {
  user: TUserEntity;
  authToken: string;
  refreshToken: string;
}

export interface IAuthState {
  clearAuth: () => void;
  user: TUserEntity | null;
  authToken: string | null;
  refreshToken: string | null;
  setAuth: (data: ISetAuthParams) => void;
}

export const useAuthStore = createStore<IAuthState>(
  (set) => {
    return {
      user: null,
      authToken: null,
      refreshToken: null,
      setAuth: (data) => {
        return set((state) => {
          state.user = data.user;
          state.authToken = data.authToken;
          state.refreshToken = data.refreshToken;
        });
      },
      clearAuth: () => {
        return set((state) => {
          state.user = null;
          state.authToken = null;
          state.refreshToken = null;
        });
      },
    };
  },
  {
    name: 'AuthStore',
  },
);
