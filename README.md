# PingCode MCP Server

PingCode MCP Server 是一个基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的服务，让 AI 助手（如 Claude、Cursor 等）能够通过自然语言与 PingCode 进行交互，完成项目管理、需求跟踪、测试管理等操作。

## 功能特性

- **双模式认证**：支持企业令牌（client_credentials）和用户令牌（OAuth2）
- **多环境支持**：支持公有云和私有部署
- **自动 Token 刷新**：Token 过期前自动刷新，无需手动干预
- **配置持久化**：认证信息保存到本地，支持通过命令重新配置
- **丰富的 API 覆盖**：项目、工作项、迭代、工时、评论、发布等模块
- **智能请求重试**：对 429（限流）和 5xx（服务端错误）自动指数退避重试
- **参数校验**：工具调用前自动校验参数，返回清晰的中文错误提示
- **分级日志**：通过 `PINGCODE_LOG_LEVEL` 环境变量控制日志级别
- **PRD 创建保护**：best-effort 模式 + 详细的成功/失败报告
- **集成测试**：内置完整测试脚本，一键验证所有 API 连通性

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装方式

### 方式一：从源码安装（推荐开发使用）

```bash
# 1. 克隆仓库
git clone <repository-url>
cd pingcode-mcp

# 2. 安装依赖
npm install

# 3. 编译 TypeScript
npm run build

# 4. 链接到全局（可选，方便命令行使用）
npm link
```

### 方式二：本地运行（不安装到全局）

```bash
# 1. 进入项目目录
cd pingcode-mcp

# 2. 安装依赖
npm install

# 3. 使用 tsx 直接运行（开发模式）
npx tsx src/cli.ts configure
```

## 配置认证

### 首次配置

运行配置命令，按提示输入信息：

```bash
# 如果已链接全局
pingcode-mcp configure

# 或者使用 npx
npx tsx src/cli.ts configure

# 或者编译后运行
npm run build
node dist/cli.js configure
```

配置流程：

```
=== PingCode MCP 认证配置 ===

请选择令牌类型
  1. 企业令牌 - 用于访问企业级接口，需要 Client ID 和 Client Secret
  2. 用户令牌 - 用于访问个人相关接口，需要账号和密码
请选择 (输入序号): 2

是否为私有部署的 PingCode？
私有部署需要输入您的 PingCode 服务地址，如 https://pingcode.yourcompany.com
(y/n): n

请输入您的 PingCode 子域名（如 dennising）: dennising
请输入 Client ID: your-client-id
请输入 Client Secret: your-client-secret
请输入账号（用户名/邮箱/手机号）: yaoshuailei
请输入密码: ysl123

正在通过 OAuth2 流程获取用户令牌，请稍候...
用户令牌获取成功！

认证配置已保存。
配置完成！
```

### 配置说明

#### 1. 部署地址选择

| 选项 | 说明 | 示例 |
|------|------|------|
| 公有云 | PingCode 官方服务，需要输入子域名 | `https://dennising.pingcode.com` |
| 私有部署 | 企业自建 PingCode 服务 | `https://pingcode.yourcompany.com` |

#### 2. 令牌类型选择

| 类型 | 适用场景 | 所需信息 |
|------|---------|---------|
| **企业令牌** | 访问企业级接口（成员管理、部门管理等） | Client ID + Client Secret |
| **用户令牌** | 访问个人相关接口（我的工作项、个人设置等） | Client ID + Client Secret + 账号 + 密码 |

#### 3. 获取企业令牌凭据

在 PingCode 管理后台：
1. 进入「应用管理」或「开放 API」页面
2. 创建或选择一个应用
3. 复制 **Client ID** 和 **Client Secret**

#### 4. 获取用户令牌凭据

- **Client ID / Client Secret**：在 PingCode 应用管理中获取
- **账号/密码**：您的 PingCode 登录账号

### 查看配置状态

```bash
pingcode-mcp status
```

输出示例：

```
=== PingCode MCP 配置状态 ===
部署地址: https://dennising.pingcode.com
令牌类型: 用户令牌
Client ID: SqwDsTDOlCUp
Token 状态: 有效
过期时间: 2591945 秒后
```

### 重新配置

如需更改部署地址或切换令牌类型：

```bash
pingcode-mcp configure
```

此命令会清除旧配置并重新运行配置向导。

### 日志配置

通过环境变量 `PINGCODE_LOG_LEVEL` 控制日志输出级别：

| 级别 | 说明 |
|------|------|
| `debug` | 输出所有日志，包括 HTTP 请求/响应详情（排查问题时使用） |
| `info` | 输出一般信息和错误（默认级别） |
| `warn` | 仅输出警告和错误 |
| `error` | 仅输出错误 |
| `silent` | 不输出任何日志 |

所有日志同时写入 `~/.pingcode-mcp/mcp.log` 文件。

```bash
# 调试模式运行（输出完整请求链路）
PINGCODE_LOG_LEVEL=debug node dist/index.js
```

### 集成测试

运行集成测试脚本，验证 PingCode API 连通性：

```bash
npm run test:integration
```

测试覆盖：身份验证、团队信息、用户列表、项目列表、产品列表、工时类型、Wiki 空间。

## 在 MCP Client 中使用

### Claude Desktop 配置

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`（macOS）：

```json
{
  "mcpServers": {
    "pingcode": {
      "command": "node",
      "args": [
        "/absolute/path/to/pingcode-mcp/dist/index.js"
      ],
      "env": {}
    }
  }
}
```

如果已全局链接，可以直接使用：

```json
{
  "mcpServers": {
    "pingcode": {
      "command": "pingcode-mcp",
      "args": []
    }
  }
}
```

### Cursor 配置

在 Cursor 设置中找到 MCP 配置，添加：

```json
{
  "mcpServers": [
    {
      "name": "pingcode",
      "command": "node /absolute/path/to/pingcode-mcp/dist/index.js"
    }
  ]
}
```

### 配置前准备

**重要**：在配置 MCP Client 前，必须先完成认证配置：

```bash
# 先运行配置命令
pingcode-mcp configure

# 确认配置成功
pingcode-mcp status
```

## 可用 Tools（共 28 个）

### 系统管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__configure_auth` | 重新配置认证信息 | 无（交互式） |

### 个人与团队

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__get_myself` | 获取当前登录用户信息 | 无 |
| `pingcode__get_team` | 获取企业/团队信息 | 无 |
| `pingcode__list_users` | 获取企业成员列表 | 无 |

### 项目管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_projects` | 获取项目列表，支持关键词搜索 | 无 |
| `pingcode__get_project` | 获取指定项目详细信息 | `project_id` |

### 工作项管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_work_items` | 获取项目管理工作项列表（story/bug/task/epic/feature），按多维度筛选 | 无 |
| `pingcode__get_work_item` | 获取单个工作项完整详情 | `work_item_id` |
| `pingcode__create_work_item` | 创建新工作项（任务/Bug/需求等） | `project_id`, `type_id`, `title` |
| `pingcode__update_work_item` | 更新工作项属性 | `work_item_id` |

> 💡 **区分说明**：`list_work_items` 查询 __项目管理__ 中的研发工作项（story/bug/task 等），是研发实现阶段的对象。`list_requirements` 查询 __产品管理__ 中的产品需求（用户需求/原始需求），是产品规划阶段的对象。

### 迭代管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_sprints` | 获取迭代列表 | 无 |
| `pingcode__get_sprint` | 获取指定迭代详情 | `sprint_id` |

### 产品管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_products` | 获取产品列表 | 无 |
| `pingcode__list_requirements` | 获取产品管理中的产品需求列表（用户需求/原始需求，非项目工作项） | 无 |

### 工时管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__create_workload` | 为工作项登记工时 | `principal_id`, `principal_type`, `type_id`, `duration`, `report_at` |
| `pingcode__list_workloads` | 获取工时记录列表（支持按时间、登记人筛选） | `principal_type` |
| `pingcode__list_workload_types` | 获取工时类型列表 | 无 |

### 评论协作

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__create_comment` | 为工作项等资源添加评论 | `principal_type`, `principal_id`, `content` |
| `pingcode__list_comments` | 获取评论列表 | `principal_type`, `principal_id` |

### 发布管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_releases` | 获取项目发布列表 | `project_id` |
| `pingcode__get_release` | 获取发布详情 | `release_id` |

### Wiki 知识管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_wiki_spaces` | 获取所有 Wiki 空间列表 | 无 |
| `pingcode__list_wiki_pages` | 获取指定空间下的页面列表 | `space_id` |
| `pingcode__get_wiki_page` | 获取 Wiki 页面 Markdown 正文 | `page_id` |

### 附件管理

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__list_attachments` | 获取指定资源的附件列表 | `principal_type`, `principal_id` |
| `pingcode__get_attachment` | 获取单个附件详细信息 | `attachment_id`, `principal_type`, `principal_id` |

### 工作报告

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__weekly_report` | 生成本周工作报告（含更新工作项、工时明细、汇总） | 无 |

### PRD 需求创建

| Tool | 描述 | 必填参数 |
|------|------|----------|
| `pingcode__create_from_prd` | 根据 PRD 文档自动创建需求层级（父需求 + 子需求拆解），LLM 分析 PRD 后调用本工具批量创建 | `project_id`, `title` |

### 筛选参数速查

#### `pingcode__list_work_items` 常用筛选

| 参数 | 说明 | 示例 |
|------|------|------|
| `identifier` | 工作项编号 | `SCR-1` |
| `project_ids` | 项目ID（逗号分隔） | `658ab0802b2c280471f9cefc` |
| `type_ids` | 类型ID | `epic,feature,story,task,bug,issue` |
| `assignee_ids` | 负责人ID | `d085a54297b34907b3a29c5d8edb98cc` |
| `state_ids` | 状态ID | `636083f4786afd44bdc64b61` |
| `sprint_ids` | 迭代ID | 迭代的具体ID |
| `keywords` | 关键词搜索（编号/标题） | `登录` |
| `page_index` | 页码（从0开始） | `0` |
| `page_size` | 每页条数 | `30` |

#### `pingcode__list_users` 常用筛选

| 参数 | 说明 | 示例 |
|------|------|------|
| `keywords` | 姓名/用户名模糊搜索 | `张三` |
| `name` | 精确名称搜索 | `yaoshuailei` |
| `emails` | 邮箱（逗号分隔） | `a@b.com,c@d.com` |
| `mobiles` | 手机号（逗号分隔） | `13800138000` |
| `department_ids` | 部门ID（逗号分隔） | `dept1,dept2` |

## 使用示例

配置完成后，在 AI 助手对话中可以直接使用自然语言：

### 项目管理
```
用户: 帮我查看一下最近的项目
AI: [调用 pingcode__list_projects]

用户: 查看项目 DEMO3 的详细信息
AI: [调用 pingcode__get_project, project_id="658ab0802b2c280471f9cefc"]

用户: 我参与了哪些项目
AI: [调用 pingcode__list_projects → pingcode__list_work_items 筛选]
```

### 工作项管理
```
用户: 列出我的工作项
AI: [调用 pingcode__list_work_items]

用户: 我有哪些负责的工作项
AI: [调用 pingcode__list_work_items, assignee_ids="我的ID"]

用户: 有没有本月到期的
AI: [调用 pingcode__list_work_items 结合时间筛选]

用户: 创建一个 Bug，标题是"登录页面报错"
AI: [调用 pingcode__create_work_item, type_id="bug", title="登录页面报错"]

用户: 把任务 DEMO3-1389 分配给我
AI: [调用 pingcode__update_work_item, assignee_id="我的ID"]

用户: 把我负责的所有工作项更新为已完成
AI: [批量调用 pingcode__update_work_item]
```

### 工时管理
```
用户: 我在 DEMO3-1389 上花了 3 小时
AI: [调用 pingcode__create_workload]

用户: 查看我本周登记的工时
AI: [调用 pingcode__list_workloads, report_by_id="我的ID", start_at=..., end_at=...]

用户: 看看有什么工时类型可选
AI: [调用 pingcode__list_workload_types]
```

### Wiki 知识管理
```
用户: 查看有哪些 Wiki 空间
AI: [调用 pingcode__list_wiki_spaces]

用户: 列出"示例空间"下的所有页面
AI: [调用 pingcode__list_wiki_pages, space_id="636083f4d18d1aeb7b76b236"]

用户: 读取 Wiki 页面"使用场景"的内容
AI: [调用 pingcode__get_wiki_page, page_id="636083f4d18d1aeb7b76b239"]
```

### 工作报告
```
用户: 帮我生成本周周报
AI: [调用 pingcode__weekly_report]

→ 自动输出 Markdown 格式周报：
  - 本周涉及的工作项列表（来源1: updated_between 查询 + 来源2: 工时反查）
  - 本周工时明细表（日期、工时、工作项、项目、审核状态）
  - 汇总：涉及工作项数 + 工时合计
```

### PRD 需求创建
```
用户: 我有一个 PRD，帮我创建到 PingCode 里
（附上 PRD 文档文本）
AI: [分析 PRD 内容，拆解为结构化需求层级]
    [调用 pingcode__create_from_prd, {
      project_id: "xxx",
      title: "用户认证模块优化",
      type_id: "epic",
      description: "...",
      children: [
        { title: "支持手机号+验证码登录", type_id: "story", description: "..." },
        { title: "支持第三方 OAuth 登录（微信/飞书）", type_id: "story", description: "..." },
        { title: "登录页面 UI 改版", type_id: "story", description: "..." },
        { title: "Token 自动续期机制", type_id: "story", description: "..." }
      ]
    }]

→ 创建成功，输出层级结构：
  - 父需求: PRJ-100 用户认证模块优化
  - 子需求 (4个):
    - PRJ-101 支持手机号+验证码登录
    - PRJ-102 支持第三方 OAuth 登录
    - PRJ-103 登录页面 UI 改版
    - PRJ-104 Token 自动续期机制

用户: 把上面的子需求再细化一下"Token 自动续期机制"
AI: [调用 pingcode__create_from_prd, {
  project_id: "xxx",
  title: "Token 自动续期机制",
  type_id: "story",
  parent_id: "PRJ-104的ID",
  children: [
    { title: "前端拦截器检测 Token 过期", type_id: "task" },
    { title: "后端 Refresh Token 接口", type_id: "task" },
    { title: "并发请求 Token 刷新队列", type_id: "task" }
  ]
}]
```

### 成员查询
```
用户: 帮我找一个叫"张三"的同事
AI: [调用 pingcode__list_users, keywords="张三"]
```

### 迭代与发布
```
用户: 查看 Sprint 5 包含哪些工作项
AI: [调用 pingcode__list_work_items, sprint_ids="Sprint5的ID"]

用户: 查看项目 DEMO3 的发布列表
AI: [调用 pingcode__list_releases, project_id="658ab0802b2c280471f9cefc"]
```

## 故障排查

### 1. 启动失败：未找到认证配置

**错误信息**：
```
PingCode MCP Server 启动失败：未找到认证配置。
请先运行配置流程。
```

**解决方案**：
```bash
pingcode-mcp configure
```

### 2. Token 过期

**现象**：API 请求返回 401 Unauthorized

**解决方案**：
- 如果配置了 `refresh_token`，系统会自动刷新
- 如果刷新失败，重新运行配置：
  ```bash
  pingcode-mcp configure
  ```

### 3. 私有部署连接失败

**检查清单**：
- [ ] 确认私有部署地址格式正确（包含协议，如 `https://`）
- [ ] 确认网络可以访问该地址
- [ ] 确认 PingCode 服务正常运行

### 4. 企业令牌获取失败

**检查清单**：
- [ ] 确认 Client ID 和 Client Secret 正确无误
- [ ] 确认应用有相应的 API 权限
- [ ] 检查 PingCode 后台应用的授权范围

### 5. 用户令牌获取失败

**检查清单**：
- [ ] 确认 Client ID、Client Secret、账号和密码正确
- [ ] 确认账号可以正常登录 PingCode Web 端
- [ ] 如果是私有部署，确认 OAuth2 配置正确
- [ ] 查看日志文件 `~/.pingcode-mcp/error_log.txt` 获取详细错误信息

## 开发

```bash
# 开发模式运行
npm run dev

# 类型检查
npm run typecheck

# 构建
npm run build

# 启动
npm start
```

## 项目结构

```
pingcode-mcp/
├── src/
│   ├── auth/              # 鉴权模块
│   │   ├── types.ts       # 类型定义
│   │   ├── config.ts      # 配置持久化
│   │   ├── enterprise-auth.ts  # 企业令牌认证
│   │   ├── personal-auth.ts    # 用户令牌认证（OAuth2）
│   │   ├── token-manager.ts    # Token 管理
│   │   └── setup.ts       # 配置向导
│   ├── client/
│   │   └── pingcode-client.ts  # HTTP 客户端（自动注入 Token 和 BaseUrl）
│   ├── tools/             # 功能模块
│   │   ├── index.ts       # 工具统一导出
│   │   ├── project.ts     # 项目管理
│   │   ├── work-item.ts   # 工作项管理
│   │   ├── sprint.ts      # 迭代管理
│   │   ├── product.ts     # 产品管理
│   │   ├── workload.ts    # 工时管理
│   │   ├── comment.ts     # 评论管理
│   │   ├── release.ts     # 发布管理
│   │   ├── wiki.ts        # Wiki 知识管理
│   │   ├── attachment.ts  # 附件管理
│   │   └── report.ts      # 周报生成
│   ├── utils/
│   │   ├── prompts.ts     # 交互式提示
│   │   ├── http.ts        # HTTP 工具
│   │   └── logger.ts      # 日志工具
│   ├── index.ts           # MCP Server 入口
│   └── cli.ts             # CLI 工具
├── package.json
├── tsconfig.json
└── README.md
```

## 许可证

ISC
