import { createHash } from 'crypto';
import { createAxiosInstance } from '../utils/http.js';
import { logRequest, logResponse, logError } from '../utils/logger.js';
import { parseExpiresAt } from './types.js';
import type { PersonalCredentials, TokenPair } from './types.js';

function md5(text: string): string {
  return createHash('md5').update(text).digest('hex');
}

async function simulateLogin(baseUrl: string, subdomain: string | undefined, credentials: PersonalCredentials): Promise<string> {
  const loginBase = subdomain ? `https://${subdomain}.pingcode.com` : baseUrl;
  const loginUrl = `${loginBase}/api/typhon/team/signin`;
  const axios = createAxiosInstance();

  const requestBody = {
    signin_name: credentials.signinName,
    password: md5(credentials.password),
  };

  logRequest('simulateLogin', loginUrl, requestBody);

  try {
    const response = await axios.post(
      loginUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        maxRedirects: 0,
        validateStatus: (status) => status < 400 || status === 302,
      }
    );

    logResponse('simulateLogin', response.status, response.data, undefined, response.headers);

    const setCookie = response.headers['set-cookie'];
    if (!setCookie || setCookie.length === 0) {
      throw new Error('Login failed: no session cookie returned');
    }

    return setCookie.map((c) => c.split(';')[0]).join('; ');
  } catch (error) {
    logError('simulateLogin', error);
    throw error;
  }
}

async function getTransactionId(baseUrl: string, cookie: string, clientId: string): Promise<string> {
  const url = `${baseUrl}/oauth2/authorize`;
  const axios = createAxiosInstance();

  const requestParams = {
    response_type: 'code',
    client_id: clientId,
  };

  logRequest('getTransactionId', url, requestParams, { Cookie: cookie });

  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers: {
        Cookie: cookie,
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    const html = response.data as string;
    logResponse('getTransactionId', response.status, html, undefined, response.headers);

    // 使用 Python 脚本中的正则表达式提取 transaction_id
    // match = re.search(r'(?<=transaction_id=)[^&"]+', res2.text)
    const match = html.match(/(?<=transaction_id=)[^&"]+/);

    if (match && match[0]) {
      return match[0];
    }

    // 尝试备用匹配模式
    // match = re.search(r'transaction_id=([a-f0-9-]+)', res2.text)
    const fallbackMatch = html.match(/transaction_id=([a-f0-9-]+)/);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }

    throw new Error('Failed to extract transaction_id from authorization page');
  } catch (error) {
    logError('getTransactionId', error);
    throw error;
  }
}

async function getAuthorizationCode(baseUrl: string, cookie: string, transactionId: string): Promise<string> {
  const url = `${baseUrl}/oauth2/authorized`;
  const axios = createAxiosInstance();

  const requestParams = {
    transaction_id: transactionId,
  };

  logRequest('getAuthorizationCode', url, requestParams, { Cookie: cookie });

  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers: {
        Cookie: cookie,
      },
      maxRedirects: 0,
      validateStatus: (status) => status < 400,
    });

    const html = response.data as string;
    logResponse('getAuthorizationCode', response.status, html.substring(0, 5000), undefined, response.headers);

    // 使用 Python 脚本中的正则表达式
    // match = re.search(r"window\.location\s*=\s*decodeURIComponent\(\"(.*?)\"\)", res3.text)
    const match = html.match(/window\.location\s*=\s*decodeURIComponent\("(.*?)"\)/);
    if (match && match[1]) {
      const decoded = decodeURIComponent(match[1]);
      // code_match = re.search(r"code=(.*?)(&|$)", url)
      const codeMatch = decoded.match(/code=(.*?)(&|$)/);
      if (codeMatch && codeMatch[1]) {
        return codeMatch[1];
      }
    }

    throw new Error('Failed to extract authorization code from authorized page');
  } catch (error) {
    logError('getAuthorizationCode', error);
    throw error;
  }
}

function getApiPrefix(isPrivate: boolean): string {
  return isPrivate ? '/open' : '';
}

async function exchangeCodeForToken(baseUrl: string, code: string, clientId: string, clientSecret: string, isPrivate: boolean): Promise<TokenPair> {
  const prefix = getApiPrefix(isPrivate);
  const url = `${baseUrl}${prefix}/v1/auth/token`;
  const axios = createAxiosInstance();

  const requestParams = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
  };

  logRequest('exchangeCodeForToken', url, requestParams);

  try {
    const response = await axios.get(url, {
      params: requestParams,
      headers: {
        Accept: 'application/json',
      },
    });

    logResponse('exchangeCodeForToken', response.status, response.data, undefined, response.headers);

    const data = response.data;

    if (!data.access_token) {
      throw new Error('Failed to obtain access token: access_token missing in response');
    }

    const { expiresIn, expiresAt } = parseExpiresAt(data.expires_in, 7200);

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || '',
      expiresIn,
      expiresAt,
    };
  } catch (error) {
    logError('exchangeCodeForToken', error);
    throw error;
  }
}

export async function getPersonalToken(
  baseUrl: string,
  credentials: PersonalCredentials,
  isPrivate: boolean,
  subdomain?: string
): Promise<TokenPair> {
  const cookie = await simulateLogin(baseUrl, subdomain, credentials);
  const transactionId = await getTransactionId(baseUrl, cookie, credentials.clientId);
  const code = await getAuthorizationCode(baseUrl, cookie, transactionId);
  const tokenPair = await exchangeCodeForToken(baseUrl, code, credentials.clientId, credentials.clientSecret, isPrivate);
  return tokenPair;
}
