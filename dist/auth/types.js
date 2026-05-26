export function parseExpiresAt(rawExpiresIn, fallbackSeconds) {
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
//# sourceMappingURL=types.js.map