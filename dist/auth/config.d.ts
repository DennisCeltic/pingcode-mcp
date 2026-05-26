import type { AuthState, TokenPair } from './types.js';
export declare function loadAuthState(): AuthState | null;
export declare function saveAuthState(state: AuthState): void;
export declare function clearAuthState(): void;
export declare function isTokenValid(tokens: TokenPair | null): boolean;
//# sourceMappingURL=config.d.ts.map