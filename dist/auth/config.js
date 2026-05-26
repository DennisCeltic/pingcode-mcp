import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
const CONFIG_DIR = join(homedir(), '.pingcode-mcp');
const CONFIG_FILE = join(CONFIG_DIR, 'auth.json');
function ensureConfigDir() {
    if (!existsSync(CONFIG_DIR)) {
        mkdirSync(CONFIG_DIR, { recursive: true });
    }
}
export function loadAuthState() {
    try {
        if (!existsSync(CONFIG_FILE)) {
            return null;
        }
        const data = readFileSync(CONFIG_FILE, 'utf-8');
        const persisted = JSON.parse(data);
        // 兼容旧配置，如果没有 isPrivate 字段，根据 baseUrl 判断
        const config = {
            baseUrl: persisted.config.baseUrl,
            tokenType: persisted.config.tokenType,
            isPrivate: persisted.config.isPrivate ?? !persisted.config.baseUrl.includes('pingcode.com'),
            subdomain: persisted.config.subdomain,
        };
        return {
            config,
            enterprise: persisted.enterprise
                ? { clientId: persisted.enterprise.clientId, clientSecret: '' }
                : undefined,
            personal: persisted.personal
                ? { clientId: persisted.personal.clientId, clientSecret: '', signinName: persisted.personal.signinName, password: '' }
                : undefined,
            tokens: persisted.tokens,
        };
    }
    catch {
        return null;
    }
}
export function saveAuthState(state) {
    ensureConfigDir();
    const persisted = {
        config: {
            baseUrl: state.config.baseUrl,
            tokenType: state.config.tokenType,
            isPrivate: state.config.isPrivate,
            subdomain: state.config.subdomain,
        },
        enterprise: state.enterprise
            ? { clientId: state.enterprise.clientId }
            : undefined,
        personal: state.personal
            ? { clientId: state.personal.clientId, clientSecret: state.personal.clientSecret, signinName: state.personal.signinName }
            : undefined,
        tokens: state.tokens,
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(persisted, null, 2), 'utf-8');
}
export function clearAuthState() {
    try {
        if (existsSync(CONFIG_FILE)) {
            writeFileSync(CONFIG_FILE, '{}', 'utf-8');
        }
    }
    catch {
        // ignore
    }
}
export function isTokenValid(tokens) {
    if (!tokens)
        return false;
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000;
    return tokens.expiresAt > now + bufferMs;
}
//# sourceMappingURL=config.js.map