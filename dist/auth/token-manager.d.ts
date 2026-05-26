import type { AuthState } from './types.js';
export declare class TokenManager {
    private state;
    initialize(): Promise<boolean>;
    setState(state: AuthState): void;
    getState(): AuthState | null;
    getAccessToken(): string | null;
    isAuthenticated(): boolean;
    refreshToken(): Promise<boolean>;
    ensureValidToken(): Promise<string | null>;
    clear(): void;
}
export declare const tokenManager: TokenManager;
//# sourceMappingURL=token-manager.d.ts.map