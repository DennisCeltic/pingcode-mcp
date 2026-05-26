import { createAxiosInstance } from '../utils/http.js';
import { loadAuthState, saveAuthState, isTokenValid, clearAuthState } from './config.js';
export class TokenManager {
    state = null;
    async initialize() {
        this.state = loadAuthState();
        if (!this.state) {
            return false;
        }
        return true;
    }
    setState(state) {
        this.state = state;
        saveAuthState(state);
    }
    getState() {
        return this.state;
    }
    getAccessToken() {
        return this.state?.tokens?.accessToken || null;
    }
    isAuthenticated() {
        if (!this.state || !this.state.tokens)
            return false;
        return isTokenValid(this.state.tokens);
    }
    async refreshToken() {
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
            const tokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || this.state.tokens.refreshToken,
                expiresIn,
                expiresAt: Date.now() + expiresIn * 1000,
            };
            this.state.tokens = tokens;
            saveAuthState(this.state);
            return true;
        }
        catch {
            return false;
        }
    }
    async ensureValidToken() {
        if (!this.state)
            return null;
        if (isTokenValid(this.state.tokens)) {
            return this.state.tokens.accessToken;
        }
        const refreshed = await this.refreshToken();
        if (refreshed) {
            return this.state.tokens.accessToken;
        }
        return null;
    }
    clear() {
        this.state = null;
        clearAuthState();
    }
}
export const tokenManager = new TokenManager();
//# sourceMappingURL=token-manager.js.map