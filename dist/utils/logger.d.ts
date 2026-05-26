export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
export declare function logDebug(message: string, data?: unknown): void;
export declare function logInfo(message: string, data?: unknown): void;
export declare function logWarn(message: string, data?: unknown): void;
export declare function logError(message: string, error?: unknown): void;
export declare function logRequest(step: string, url: string, params?: unknown, headers?: unknown): void;
export declare function logResponse(step: string, status: number, data: unknown, startTime?: number, headers?: unknown): void;
//# sourceMappingURL=logger.d.ts.map