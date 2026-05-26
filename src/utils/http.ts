import axios from 'axios';
import https from 'https';
import { logDebug, logWarn } from './logger.js';

const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

export function createAxiosInstance() {
  const instance = axios.create({
    httpsAgent,
    timeout: 30000,
  });

  instance.interceptors.request.use((config) => {
    logDebug(`HTTP ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      data: config.data,
    });
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      logDebug(`HTTP ${response.status} ${response.config.url}`, {
        status: response.status,
        size: JSON.stringify(response.data).length,
      });
      return response;
    },
    (error) => {
      if (error.response) {
        logWarn(`HTTP ${error.response.status} ${error.config?.url}`, {
          status: error.response.status,
          data: error.response.data,
        });
      } else {
        logWarn(`HTTP request failed: ${error.message}`);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
