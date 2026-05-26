#!/usr/bin/env node

import { tokenManager, runAuthSetup, loadAuthState } from './auth/index.js';

async function main() {
  const command = process.argv[2];

  if (command === 'configure' || command === 'config') {
    try {
      await runAuthSetup();
      console.log('\n配置完成！');
      process.exit(0);
    } catch (error) {
      console.error('配置失败:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  if (command === 'status') {
    const state = loadAuthState();
    if (!state) {
      console.log('未配置认证信息。');
      console.log('请运行: pingcode-mcp configure');
      process.exit(1);
    }

    console.log('=== PingCode MCP 配置状态 ===');
    console.log(`部署地址: ${state.config.baseUrl}`);
    console.log(`令牌类型: ${state.config.tokenType === 'enterprise' ? '企业令牌' : '用户令牌'}`);

    if (state.config.tokenType === 'enterprise' && state.enterprise) {
      console.log(`Client ID: ${state.enterprise.clientId}`);
    }

    if (state.config.tokenType === 'personal' && state.personal) {
      console.log(`账号: ${state.personal.signinName}`);
    }

    if (state.tokens) {
      const isValid = state.tokens.expiresAt > Date.now();
      console.log(`Token 状态: ${isValid ? '有效' : '已过期'}`);
      if (isValid) {
        const expiresIn = Math.floor((state.tokens.expiresAt - Date.now()) / 1000);
        console.log(`过期时间: ${expiresIn} 秒后`);
      }
    } else {
      console.log('Token 状态: 未获取');
    }

    process.exit(0);
  }

  console.log('PingCode MCP CLI');
  console.log('');
  console.log('用法:');
  console.log('  pingcode-mcp configure    配置认证信息');
  console.log('  pingcode-mcp status       查看配置状态');
  console.log('');
  console.log('直接运行 pingcode-mcp 启动 MCP Server（需要已配置认证）');
  process.exit(1);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
