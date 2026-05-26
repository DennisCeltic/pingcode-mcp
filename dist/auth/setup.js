import { askYesNo, askInput, askSelect, askPassword, closePrompts, } from '../utils/prompts.js';
import { getEnterpriseToken } from './enterprise-auth.js';
import { getPersonalToken } from './personal-auth.js';
import { tokenManager } from './token-manager.js';
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
async function setupEnterpriseBaseUrl() {
    const isPrivate = await askYesNo('是否为私有部署的 PingCode？', '私有部署需要输入您的 PingCode 服务地址，如 https://pingcode.yourcompany.com');
    if (isPrivate) {
        const url = await askInput('请输入私有部署地址', {
            validate: (value) => isValidUrl(value),
        });
        return { baseUrl: url.replace(/\/$/, ''), isPrivate: true };
    }
    return { baseUrl: 'https://open.pingcode.com', isPrivate: false };
}
async function setupPersonalBaseUrl() {
    const isPrivate = await askYesNo('是否为私有部署的 PingCode？', '私有部署需要输入您的 PingCode 服务地址，如 https://pingcode.yourcompany.com');
    if (isPrivate) {
        const url = await askInput('请输入私有部署地址', {
            validate: (value) => isValidUrl(value),
        });
        return { baseUrl: url.replace(/\/$/, ''), isPrivate: true };
    }
    const subdomain = await askInput('请输入您的 PingCode 子域名（如 dennising）:', {
        validate: (value) => value.length > 0,
    });
    return { baseUrl: `https://open.pingcode.com`, isPrivate: false, subdomain };
}
async function setupTokenType() {
    return askSelect('请选择令牌类型', [
        {
            value: 'enterprise',
            label: '企业令牌',
            description: '用于访问企业级接口，需要 Client ID 和 Client Secret',
        },
        {
            value: 'personal',
            label: '用户令牌',
            description: '用于访问个人相关接口，需要账号和密码',
        },
    ]);
}
async function setupEnterpriseCredentials() {
    const clientId = await askInput('请输入 Client ID:');
    const clientSecret = await askPassword('请输入 Client Secret:');
    return { clientId, clientSecret };
}
async function setupPersonalCredentials() {
    const clientId = await askInput('请输入 Client ID:');
    const clientSecret = await askPassword('请输入 Client Secret:');
    const signinName = await askInput('请输入账号（用户名/邮箱/手机号）:');
    const password = await askPassword('请输入密码:');
    return { clientId, clientSecret, signinName, password };
}
export async function runAuthSetup() {
    tokenManager.clear();
    console.log('=== PingCode MCP 认证配置 ===\n');
    const tokenType = await setupTokenType();
    let baseUrl;
    let isPrivate;
    let subdomain;
    if (tokenType === 'enterprise') {
        const result = await setupEnterpriseBaseUrl();
        baseUrl = result.baseUrl;
        isPrivate = result.isPrivate;
    }
    else {
        const result = await setupPersonalBaseUrl();
        baseUrl = result.baseUrl;
        isPrivate = result.isPrivate;
        subdomain = result.subdomain;
    }
    const config = {
        baseUrl,
        tokenType,
        isPrivate,
        subdomain,
    };
    let state = {
        config,
        tokens: null,
    };
    try {
        if (tokenType === 'enterprise') {
            console.log('\n正在获取企业令牌...');
            const credentials = await setupEnterpriseCredentials();
            const tokens = await getEnterpriseToken(baseUrl, credentials, isPrivate);
            state = {
                config,
                enterprise: credentials,
                tokens,
            };
            console.log('企业令牌获取成功！');
        }
        else {
            console.log('\n正在通过 OAuth2 流程获取用户令牌，请稍候...');
            const credentials = await setupPersonalCredentials();
            const tokens = await getPersonalToken(baseUrl, credentials, isPrivate, subdomain);
            state = {
                config,
                personal: credentials,
                tokens,
            };
            console.log('用户令牌获取成功！');
        }
        tokenManager.setState(state);
        console.log('\n认证配置已保存。');
        return state;
    }
    catch (error) {
        console.error('\n认证失败:', error instanceof Error ? error.message : String(error));
        throw error;
    }
    finally {
        closePrompts();
    }
}
//# sourceMappingURL=setup.js.map