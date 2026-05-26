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

export function parseExpiresAt(rawExpiresIn: unknown, fallbackSeconds: number): { expiresIn: number; expiresAt: number } {
  const value = typeof rawExpiresIn === 'number' ? rawExpiresIn : fallbackSeconds;

  if (value > 1000000000) {
    const expiresAt = value * 1000;
    const expiresIn = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    return { expiresIn, expiresAt };
  }

  const expiresIn = value;
  const expiresAt = Date.now() + expiresIn * 1000;
  return { expiresIn, expiresAt };
}

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
