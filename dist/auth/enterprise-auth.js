import { createAxiosInstance } from '../utils/http.js';
import { logRequest, logResponse, logError } from '../utils/logger.js';
import { parseExpiresAt } from './types.js';
export async function getEnterpriseToken(baseUrl, credentials, isPrivate = false) {
    const prefix = isPrivate ? '/open' : '';
    const url = `${baseUrl}${prefix}/v1/auth/token`;
    const axios = createAxiosInstance();
    logRequest('getEnterpriseToken', url, {
        grant_type: 'client_credentials',
        client_id: credentials.clientId,
    });
    try {
        const response = await axios.get(url, {
            params: {
                grant_type: 'client_credentials',
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
            },
            headers: {
                Accept: 'application/json',
            },
        });
        logResponse('getEnterpriseToken', response.status, response.data);
        const data = response.data;
        if (!data.access_token) {
            throw new Error('Failed to obtain enterprise token: access_token missing in response');
        }
        const { expiresIn, expiresAt } = parseExpiresAt(data.expires_in, 2592000);
        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || '',
            expiresIn,
            expiresAt,
        };
    }
    catch (error) {
        logError('getEnterpriseToken', error);
        throw error;
    }
}
//# sourceMappingURL=enterprise-auth.js.map