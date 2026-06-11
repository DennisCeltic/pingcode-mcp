#!/usr/bin/env npx tsx

import { createWikiSpace, addWikiMembers } from '../src/tools/wiki.js';
import { pingCodeClient } from '../src/client/index.js';
import { tokenManager, loadAuthState } from '../src/auth/index.js';

interface ScriptArgs {
  name: string;
  description?: string;
  visibility?: 'private' | 'public';
  adminName?: string;
  adminEmail?: string;
}

function printHelp(): void {
  console.log(`
用法: npx tsx scripts/create-wiki-space.ts --name <空间名称> [选项]

必填参数:
  --name <名称>           知识管理空间名称

用户指定 (至少指定一种):
  --admin-name <姓名>     设置为管理员的用户姓名
  --admin-email <邮箱>    设置为管理员的用户邮箱

可选参数:
  --description <描述>    空间描述
  --visibility <类型>     可见性: private (默认) 或 public
  --help                  显示帮助信息

示例:
  npx tsx scripts/create-wiki-space.ts --name "我的知识库" --admin-name "张三"
  npx tsx scripts/create-wiki-space.ts --name "技术文档" --admin-email "zhangsan@example.com" --description "团队技术文档"
  npx tsx scripts/create-wiki-space.ts --name "公开知识库" --admin-name "李四" --visibility public
`);
}

function parseArgs(): ScriptArgs | null {
  const args = process.argv.slice(2);
  const result: ScriptArgs = { name: '' };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--help':
        printHelp();
        process.exit(0);
      case '--name':
        result.name = args[++i] ?? '';
        break;
      case '--description':
        result.description = args[++i] ?? '';
        break;
      case '--visibility':
        result.visibility = (args[++i] as 'private' | 'public') ?? 'private';
        break;
      case '--admin-name':
        result.adminName = args[++i] ?? '';
        break;
      case '--admin-email':
        result.adminEmail = args[++i] ?? '';
        break;
      default:
        break;
    }
  }

  if (!result.name) {
    console.error('错误: 缺少必填参数 --name');
    printHelp();
    return null;
  }

  if (!result.adminName && !result.adminEmail) {
    console.error('错误: 需要指定管理员用户 (--admin-name 或 --admin-email)');
    printHelp();
    return null;
  }

  return result;
}

async function findUser(name?: string, email?: string): Promise<{ id: string; name: string; email: string } | null> {
  const query = new URLSearchParams();
  query.append('page_index', '0');
  query.append('page_size', '30');

  if (name) {
    query.append('name', name);
  } else if (email) {
    query.append('emails', email);
  }

  const queryStr = query.toString() ? `?${query.toString()}` : '';
  const data = await pingCodeClient.get<{ items?: Array<{ id: string; name: string; email: string }> }>(`/v1/directory/users${queryStr}`);

  if (!data || !data.items || data.items.length === 0) {
    return null;
  }

  if (data.items.length === 1) {
    return data.items[0];
  }

  console.log('\n找到多个匹配用户:');
  data.items.forEach((user, index) => {
    console.log(`  [${index + 1}] ${user.name} (${user.email}) - ID: ${user.id}`);
  });
  console.log('请使用更精确的搜索条件');
  return null;
}

async function main() {
  const args = parseArgs();
  if (!args) {
    process.exit(1);
  }

  const authState = loadAuthState();
  if (!authState) {
    console.error('错误: 未配置认证信息。请先运行: npx tsx src/cli.ts configure');
    process.exit(1);
  }

  await tokenManager.initialize();
  const token = await tokenManager.ensureValidToken();
  if (!token) {
    console.error('错误: 认证失败，Token 无效或已过期。请重新运行: npx tsx src/cli.ts configure');
    process.exit(1);
  }

  console.log(`正在查找管理员用户...`);
  const adminUser = await findUser(args.adminName, args.adminEmail);
  if (!adminUser) {
    console.error('错误: 未找到指定的管理员用户');
    process.exit(1);
  }
  console.log(`找到用户: ${adminUser.name} (${adminUser.email})`);

  console.log(`\n正在创建知识管理空间 "${args.name}"...`);
  try {
    const space = await createWikiSpace({
      name: args.name,
      description: args.description,
      visibility: args.visibility,
    });

    const spaceData = space as { id: string; name: string };
    console.log(`空间创建成功! ID: ${spaceData.id}, 名称: ${spaceData.name}`);

    console.log(`\n正在将 ${adminUser.name} 设置为管理员...`);
    const memberResult = await addWikiMembers({
      space_id: spaceData.id,
      user_ids: [adminUser.id],
      role_id: 'admin',
    });
    console.log(`管理员设置成功!`);
    console.log(`\n结果:`, JSON.stringify(memberResult, null, 2));

    console.log(`\n=== 完成 ===`);
    console.log(`空间名称: ${spaceData.name}`);
    console.log(`空间ID: ${spaceData.id}`);
    console.log(`管理员: ${adminUser.name} (${adminUser.email})`);
  } catch (error) {
    console.error('操作失败:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
