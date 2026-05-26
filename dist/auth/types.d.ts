export type TokenType = 'enterprise' | 'personal';
export interface AuthConfig {
    baseUrl: string;
    tokenType: TokenType;
    isPrivate: boolean;
    subdomain?: string;
}
export interface EnterpriseCredentials {
    clientId: string;
    clientSecret: string;
}
export interface PersonalCredentials {
    signinName: string;
    password: string;
    clientId: string;
    clientSecret: string;
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number;
}
export declare function parseExpiresAt(rawExpiresIn: unknown, fallbackSeconds: number): {
    expiresIn: number;
    expiresAt: number;
};
export interface PersistedAuthState {
    config: AuthConfig;
    enterprise?: {
        clientId: string;
    };
    personal?: {
        clientId: string;
        clientSecret: string;
        signinName: string;
    };
    tokens: TokenPair | null;
}
export interface AuthState {
    config: AuthConfig;
    enterprise?: EnterpriseCredentials;
    personal?: PersonalCredentials;
    tokens: TokenPair | null;
}
//# sourceMappingURL=types.d.ts.map