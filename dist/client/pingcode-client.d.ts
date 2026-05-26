import { type AxiosRequestConfig } from 'axios';
export declare class PingCodeClient {
    private client;
    constructor();
    private withRetry;
    private getBaseUrl;
    private getApiPrefix;
    get<T>(path: string, config?: AxiosRequestConfig): Promise<T>;
    post<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T>(path: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    delete<T>(path: string, config?: AxiosRequestConfig): Promise<T>;
}
export declare const pingCodeClient: PingCodeClient;
//# sourceMappingURL=pingcode-client.d.ts.map