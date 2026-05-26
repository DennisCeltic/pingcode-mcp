import { appendFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

const LOG_DIR = join(homedir(), '.pingcode-mcp');
const LOG_FILE = join(LOG_DIR, 'mcp.log');

const LOG_LEVEL_MAP: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

function getLogLevel(): LogLevel {
  const env = (process.env.PINGCODE_LOG_LEVEL || 'info').toLowerCase();
  if (env in LOG_LEVEL_MAP) {
    return env as LogLevel;
  }
  return 'info';
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_MAP[level] >= LOG_LEVEL_MAP[getLogLevel()];
}

function ensureLogDir(): void {
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }
}

function formatDuration(startTime: number): string {
  const duration = Date.now() - startTime;
  if (duration < 1000) return `${duration}ms`;
  return `${(duration / 1000).toFixed(2)}s`;
}

function writeLog(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;

  ensureLogDir();
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n${data ? JSON.stringify(data, null, 2) : ''}\n---\n`;

  if (level === 'error' || level === 'warn') {
    console.error(logEntry.trim());
  }

  appendFileSync(LOG_FILE, logEntry, 'utf-8');
}

export function logDebug(message: string, data?: unknown): void {
  writeLog('debug', message, data);
}

export function logInfo(message: string, data?: unknown): void {
  writeLog('info', message, data);
}

export function logWarn(message: string, data?: unknown): void {
  writeLog('warn', message, data);
}

export function logError(message: string, error?: unknown): void {
  const err = error instanceof Error ? error.message : String(error);
  writeLog('error', message, { error: err });
}

export function logRequest(step: string, url: string, params?: unknown, headers?: unknown): void {
  writeLog('debug', `[REQUEST] ${step}`, {
    url,
    params,
    headers,
  });
}

export function logResponse(step: string, status: number, data: unknown, startTime?: number, headers?: unknown): void {
  const extra: Record<string, unknown> = {
    status,
    data,
  };
  if (startTime) {
    extra.duration = formatDuration(startTime);
  }
  if (headers) {
    extra.headers = headers;
  }
  writeLog('debug', `[RESPONSE] ${step}`, extra);
}
