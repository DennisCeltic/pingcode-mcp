import { createAxiosInstance } from '../utils/http.js';
import type { TokenPair, AuthState } from './types.js';
import { loadAuthState, saveAuthState, isTokenValid, clearAuthState } from './config.js';

export class TokenManager {
  private state: AuthState | null = null;

  async initialize(): Promise<boolean> {
    this.state = loadAuthState();
    if (!this.state) {
      return false;
    }
    return true;
  }

  setState(state: AuthState): void {
    this.state = state;
    saveAuthState(state);
  }

  getState(): AuthState | null {
    return this.state;
  }

  getAccessToken(): string | null {
    return this.state?.tokens?.accessToken || null;
  }

  isAuthenticated(): boolean {
    if (!this.state || !this.state.tokens) return false;
    return isTokenValid(this.state.tokens);
  }

  async refreshToken(): Promise<boolean> {
    if (!this.state || !this.state.tokens?.refreshToken) {
      return false;
    }

    try {
      const url = `${this.state.config.baseUrl}/v1/auth/token`;
      const axios = createAxiosInstance();
      const response = await axios.get(url, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.state.tokens.refreshToken,
        },
        headers: {
          Accept: 'application/json',
        },
      });

      const data = response.data;
      if (!data.access_token) {
        return false;
      }

      const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 7200;
      const tokens: TokenPair = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || this.state.tokens.refreshToken,
        expiresIn,
        expiresAt: Date.now() + expiresIn * 1000,
      };

      this.state.tokens = tokens;
      saveAuthState(this.state);
      return true;
    } catch {
      return false;
    }
  }

  async ensureValidToken(): Promise<string | null> {
    if (!this.state) return null;

    if (isTokenValid(this.state.tokens)) {
      return this.state.tokens!.accessToken;
    }

    const refreshed = await this.refreshToken();
    if (refreshed) {
      return this.state.tokens!.accessToken;
    }

    return null;
  }

  clear(): void {
    this.state = null;
    clearAuthState();
  }
}

export const tokenManager = new TokenManager();
