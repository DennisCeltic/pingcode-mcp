import { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { createAxiosInstance } from '../utils/http.js';
import { tokenManager } from '../auth/token-manager.js';

const MAX_RETRIES = 3;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PingCodeClient {
  private client: AxiosInstance;

  constructor() {
    this.client = createAxiosInstance();

    this.client.interceptors.request.use(async (config) => {
      const token = await tokenManager.ensureValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers.Accept = 'application/json';
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data;
          if (status === 401) {
            throw new Error(`Unauthorized: ${JSON.stringify(data)}`);
          }
          if (status === 403) {
            throw new Error(`Forbidden: ${JSON.stringify(data)}`);
          }
          if (status === 404) {
            throw new Error(`Not Found: ${JSON.stringify(data)}`);
          }
          throw new Error(`PingCode API Error (${status}): ${JSON.stringify(data)}`);
        }
        throw error;
      }
    );
  }

  private async withRetry<T>(fn: () => Promise<T>, attempt: number = 0): Promise<T> {
    try {
      return await fn();
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number }; config?: { url?: string } };
      const status = axiosError.response?.status;
      const url = axiosError.config?.url || 'unknown';

      if (status && RETRYABLE_STATUSES.has(status) && attempt < MAX_RETRIES) {
        const backoff = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 10000);
        console.error(`[RETRY] ${status} from ${url}, attempt ${attempt + 1}/${MAX_RETRIES}, waiting ${Math.round(backoff)}ms`);
        await delay(backoff);
        return this.withRetry(fn, attempt + 1);
      }
      throw error;
    }
  }

  private getBaseUrl(): string {
    const state = tokenManager.getState();
    if (!state) {
      throw new Error('Not authenticated. Please configure auth first.');
    }
    return state.config.baseUrl;
  }

  private getApiPrefix(): string {
    const state = tokenManager.getState();
    if (!state) {
      throw new Error('Not authenticated. Please configure auth first.');
    }
    return state.config.isPrivate ? '/open' : '';
  }

  async get<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${path}`;
    return this.withRetry(async () => {
      const response = await this.client.get<T>(url, config);
      return response.data;
    });
  }

  async post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${path}`;
    return this.withRetry(async () => {
      const response = await this.client.post<T>(url, data, config);
      return response.data;
    });
  }

  async patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${path}`;
    return this.withRetry(async () => {
      const response = await this.client.patch<T>(url, data, config);
      return response.data;
    });
  }

  async put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${path}`;
    return this.withRetry(async () => {
      const response = await this.client.put<T>(url, data, config);
      return response.data;
    });
  }

  async delete<T>(path: string, config?: AxiosRequestConfig): Promise<T> {
    const url = `${this.getBaseUrl()}${this.getApiPrefix()}${path}`;
    return this.withRetry(async () => {
      const response = await this.client.delete<T>(url, config);
      return response.data;
    });
  }
}

export const pingCodeClient = new PingCodeClient();
