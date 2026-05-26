#!/usr/bin/env node

import { pingCodeClient } from '../src/client/index.js';

interface TestCase {
  name: string;
  fn: () => Promise<unknown>;
}

async function runTest(name: string, fn: () => Promise<unknown>): Promise<boolean> {
  process.stdout.write(`  ${name}... `);
  try {
    const start = Date.now();
    const result = await fn();
    const duration = Date.now() - start;
    const summary = typeof result === 'object' && result !== null
      ? JSON.stringify(result).substring(0, 80)
      : String(result).substring(0, 80);
    console.log(`✅ (${duration}ms) ${summary}`);
    return true;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${msg.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('\n=== PingCode MCP 集成测试 ===\n');
  console.log('⚠️  请确保已运行配置流程: npx tsx src/cli.ts configure\n');

  const testStart = Date.now();
  let passed = 0;
  let failed = 0;

  const tests: TestCase[] = [
    {
      name: '连接检测 (get_myself)',
      fn: () => pingCodeClient.get('/v1/myself'),
    },
    {
      name: '获取团队信息',
      fn: () => pingCodeClient.get('/v1/directory/team'),
    },
    {
      name: '获取用户列表',
      fn: () => pingCodeClient.get('/v1/directory/users?page_index=0&page_size=5'),
    },
    {
      name: '获取项目列表',
      fn: () => pingCodeClient.get('/v1/project/projects?page_index=0&page_size=5'),
    },
    {
      name: '获取产品列表',
      fn: () => pingCodeClient.get('/v1/products?page_index=0&page_size=5'),
    },
    {
      name: '获取工时类型列表',
      fn: () => pingCodeClient.get('/v1/workload/types'),
    },
    {
      name: '获取 Wiki 空间列表',
      fn: () => pingCodeClient.get('/v1/wiki/spaces?page_index=0&page_size=5'),
    },
  ];

  for (const test of tests) {
    const ok = await runTest(test.name, test.fn);
    if (ok) passed++; else failed++;
  }

  console.log(`\n=== 测试结果 ===`);
  console.log(`  通过: ${passed}/${tests.length}`);
  console.log(`  失败: ${failed}/${tests.length}`);
  console.log(`  耗时: ${Date.now() - testStart}ms\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('测试运行失败:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
