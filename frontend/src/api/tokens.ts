import type { User } from './types';

/**
 * Callback invoked after `apiClient` silently refreshes the access token, so
 * AuthContext can keep its reactive `isAuthenticated` / `user` state in sync.
 * The fresh `user` from the refresh response is forwarded when available.
 */
type TokenRefreshCallback = (accessToken: string, user?: User | null) => void;

let _onTokenRefreshed: TokenRefreshCallback | null = null;
export const setTokenRefreshCallback = (cb: TokenRefreshCallback) => {
  _onTokenRefreshed = cb;
};
export const notifyTokenRefreshed = (accessToken: string, user?: User | null) => {
  _onTokenRefreshed?.(accessToken, user);
};

let _inMemoryAccessToken: string | null = null;

export const tokenStorage = {
  getAccessToken: (): string | null => _inMemoryAccessToken,
  setAccessToken: (token: string): void => {

    // api/tokens.ts
type TokenRefreshCallback = (newToken: string) => void;
let onTokenRefresh: TokenRefreshCallback | null = null;

export function setTokenRefreshCallback(cb: TokenRefreshCallback) {
  onTokenRefresh = cb;
}

export const tokenStorage = {
  setAccessToken(token: string) {
    localStorage.setItem('access_token', token); // existing line 22
    onTokenRefresh?.(token); // <-- add: notify same-tab listeners
  },
  // ...
};
    _inMemoryAccessToken = token;
  },
  clearTokens: (): void => {
    _inMemoryAccessToken = null;
  },
  hasAccessToken: (): boolean => !!_inMemoryAccessToken,
};
