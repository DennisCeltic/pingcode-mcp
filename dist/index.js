#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { tokenManager, runAuthSetup } from './auth/index.js';
import { pingCodeClient } from './client/index.js';
import { listWorkItems, getWorkItem, createWorkItem, updateWorkItem, } from './tools/work-item.js';
import { listProjects, getProject, createProject } from './tools/project.js';
import { listSprints, getSprint } from './tools/sprint.js';
import { createWorkload, listWorkloads, listWorkloadTypes, } from './tools/workload.js';
import { createComment, listComments, } from './tools/comment.js';
import { listReleases, getRelease, } from './tools/release.js';
import { listWikiSpaces, listWikiPages, getWikiPage, } from './tools/wiki.js';
import { listAttachments, getAttachment, } from './tools/attachment.js';
import { generateWeeklyReport } from './tools/report.js';
import { createFromPrd } from './tools/prd.js';
import { listActivities } from './tools/activity.js';
import { logWarn, logInfo, logError } from './utils/logger.js';
import { validateArgs } from './utils/validation.js';
const TOOLS = [
    {
        name: 'pingcode__configure_auth',
        description: '重新配置 PingCode 认证信息（部署地址、令牌类型、凭据）',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'pingcode__get_myself',
        description: '获取当前登录用户的基本信息',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'pingcode__get_team',
        description: '获取当前企业/团队信息',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'pingcode__list_users',
        description: '获取企业成员列表',
        inputSchema: {
            type: 'object',
            properties: {
                keywords: { type: 'string', description: '关键词模糊搜索，支持姓名、用户名' },
                department_ids: { type: 'string', description: '部门id，使用逗号分割，最多20个' },
                name: { type: 'string', description: '成员名称' },
                emails: { type: 'string', description: '邮箱地址，使用逗号分割，最多20个' },
                mobiles: { type: 'string', description: '手机号，使用逗号分割，最多20个' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__list_projects',
        description: '获取项目列表',
        inputSchema: {
            type: 'object',
            properties: {
                keywords: { type: 'string', description: '关键词搜索' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__get_project',
        description: '获取指定项目的详细信息',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: '项目ID' },
            },
            required: ['project_id'],
        },
    },
    {
        name: 'pingcode__create_project',
        description: '创建一个新的项目',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '项目名称' },
                type_id: { type: 'string', description: '项目类型: scrum 或 kanban', enum: ['scrum', 'kanban'] },
                description: { type: 'string', description: '项目描述' },
                assignee_id: { type: 'string', description: '项目负责人的用户ID' },
            },
            required: ['name'],
        },
    },
    {
        name: 'pingcode__list_work_items',
        description: '获取项目管理中的工作项列表，支持按项目、类型、负责人、状态、迭代等条件筛选。' +
            '工作项是项目管理维度的对象，类型包括需求(story)、缺陷(bug)、任务(task)、史诗(epic)、特性(feature)等。' +
            '如需查询产品维度的原始需求（用户需求、原始需求），请使用 pingcode__list_requirements。',
        inputSchema: {
            type: 'object',
            properties: {
                identifier: { type: 'string', description: '工作项编号，如 SCR-1' },
                project_ids: { type: 'string', description: '项目ID，使用逗号分割，最多20个' },
                type_ids: { type: 'string', description: '工作项类型ID，使用逗号分割，最多20个。固定类型：epic, feature, story, task, bug, issue' },
                assignee_ids: { type: 'string', description: '负责人ID，使用逗号分割，最多20个' },
                state_ids: { type: 'string', description: '状态ID，使用逗号分割，最多20个' },
                sprint_ids: { type: 'string', description: '迭代ID，使用逗号分割，最多20个' },
                keywords: { type: 'string', description: '关键词，支持工作项编号和标题' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__get_work_item',
        description: '获取指定工作项的详细信息',
        inputSchema: {
            type: 'object',
            properties: {
                work_item_id: { type: 'string', description: '工作项ID' },
            },
            required: ['work_item_id'],
        },
    },
    {
        name: 'pingcode__create_work_item',
        description: '创建一个新的工作项（任务/Bug/需求等）',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: '项目ID' },
                type_id: { type: 'string', description: '工作项类型ID，如 epic, feature, story, task, bug, issue 或自定义类型ID' },
                title: { type: 'string', description: '工作项标题' },
                description: { type: 'string', description: '工作项描述' },
                state_id: { type: 'string', description: '状态ID' },
                priority_id: { type: 'string', description: '优先级ID' },
                assignee_id: { type: 'string', description: '负责人ID' },
                sprint_id: { type: 'string', description: '迭代ID（仅Scrum项目有效）' },
                parent_id: { type: 'string', description: '父工作项ID' },
                story_points: { type: 'number', description: '故事点（仅Scrum/Kanban项目的story和bug有效）' },
                estimated_workload: { type: 'number', description: '预估工时' },
                remaining_workload: { type: 'number', description: '剩余工时' },
            },
            required: ['project_id', 'type_id', 'title'],
        },
    },
    {
        name: 'pingcode__update_work_item',
        description: '更新工作项的状态、负责人、迭代等属性',
        inputSchema: {
            type: 'object',
            properties: {
                work_item_id: { type: 'string', description: '工作项ID' },
                title: { type: 'string', description: '工作项标题' },
                description: { type: 'string', description: '工作项描述' },
                state_id: { type: 'string', description: '状态ID' },
                priority_id: { type: 'string', description: '优先级ID' },
                assignee_id: { type: 'string', description: '负责人ID' },
                sprint_id: { type: 'string', description: '迭代ID' },
                parent_id: { type: 'string', description: '父工作项ID' },
                story_points: { type: 'number', description: '故事点' },
                estimated_workload: { type: 'number', description: '预估工时' },
                remaining_workload: { type: 'number', description: '剩余工时' },
            },
            required: ['work_item_id'],
        },
    },
    {
        name: 'pingcode__list_sprints',
        description: '获取迭代列表',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: '项目ID' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__get_sprint',
        description: '获取指定迭代的详细信息',
        inputSchema: {
            type: 'object',
            properties: {
                sprint_id: { type: 'string', description: '迭代ID' },
            },
            required: ['sprint_id'],
        },
    },
    {
        name: 'pingcode__list_products',
        description: '获取产品列表',
        inputSchema: {
            type: 'object',
            properties: {
                keywords: { type: 'string', description: '关键词搜索' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__list_requirements',
        description: '获取产品管理中的产品需求列表。' +
            '产品需求是产品维度的对象，通常对应用户需求、原始需求，属于产品规划阶段。' +
            '而项目中的工作项（如 story、task、bug）是研发实现阶段的产物。' +
            '如需查询项目中的工作项，请使用 pingcode__list_work_items。',
        inputSchema: {
            type: 'object',
            properties: {
                product_id: { type: 'string', description: '产品ID' },
                keywords: { type: 'string', description: '关键词搜索' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 30 },
            },
        },
    },
    {
        name: 'pingcode__create_workload',
        description: '为工作项登记工时',
        inputSchema: {
            type: 'object',
            properties: {
                principal_id: { type: 'string', description: '工时主体ID（如工作项ID）' },
                principal_type: { type: 'string', description: '工时主体类型，如 work_item' },
                type_id: { type: 'string', description: '工时类型ID' },
                duration: { type: 'number', description: '工时时长（小时，0-24）' },
                report_at: { type: 'number', description: '登记日期（十位时间戳）' },
                report_by_id: { type: 'string', description: '登记人ID（企业鉴权必填）' },
                description: { type: 'string', description: '工时说明' },
            },
            required: ['principal_id', 'principal_type', 'type_id', 'duration', 'report_at'],
        },
    },
    {
        name: 'pingcode__list_workloads',
        description: '获取工时记录列表',
        inputSchema: {
            type: 'object',
            properties: {
                principal_type: { type: 'string', description: '工时主体类型，如 work_item' },
                principal_id: { type: 'string', description: '工时主体ID' },
                start_at: { type: 'number', description: '查询起始时间（十位时间戳）' },
                end_at: { type: 'number', description: '查询结束时间（十位时间戳）' },
                report_by_id: { type: 'string', description: '登记人ID' },
            },
            required: ['principal_type'],
        },
    },
    {
        name: 'pingcode__list_workload_types',
        description: '获取工时类型列表',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
    {
        name: 'pingcode__create_comment',
        description: '为工作项等资源添加评论',
        inputSchema: {
            type: 'object',
            properties: {
                principal_type: { type: 'string', description: '评论主体类型，如 work_item, test_case, ticket, idea, page' },
                principal_id: { type: 'string', description: '评论主体ID' },
                content: { type: 'string', description: '评论内容' },
            },
            required: ['principal_type', 'principal_id', 'content'],
        },
    },
    {
        name: 'pingcode__list_comments',
        description: '获取评论列表',
        inputSchema: {
            type: 'object',
            properties: {
                principal_type: { type: 'string', description: '评论主体类型' },
                principal_id: { type: 'string', description: '评论主体ID' },
            },
            required: ['principal_type', 'principal_id'],
        },
    },
    {
        name: 'pingcode__list_releases',
        description: '获取项目发布列表',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: '项目ID' },
                name: { type: 'string', description: '发布名称' },
            },
            required: ['project_id'],
        },
    },
    {
        name: 'pingcode__get_release',
        description: '获取发布详情',
        inputSchema: {
            type: 'object',
            properties: {
                release_id: { type: 'string', description: '发布ID' },
            },
            required: ['release_id'],
        },
    },
    {
        name: 'pingcode__list_wiki_spaces',
        description: '获取知识管理（Wiki）空间列表',
        inputSchema: {
            type: 'object',
            properties: {
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 100 },
            },
        },
    },
    {
        name: 'pingcode__list_wiki_pages',
        description: '获取指定 Wiki 空间下的页面列表',
        inputSchema: {
            type: 'object',
            properties: {
                space_id: { type: 'string', description: '空间ID' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 100 },
            },
            required: ['space_id'],
        },
    },
    {
        name: 'pingcode__get_wiki_page',
        description: '获取 Wiki 页面的 Markdown 正文内容',
        inputSchema: {
            type: 'object',
            properties: {
                page_id: { type: 'string', description: '页面ID' },
                format_type: { type: 'string', description: '输出格式：markdown 或 html', default: 'markdown' },
            },
            required: ['page_id'],
        },
    },
    {
        name: 'pingcode__list_attachments',
        description: '获取指定资源的附件列表（需要 principal_type 和 principal_id）',
        inputSchema: {
            type: 'object',
            properties: {
                principal_type: { type: 'string', description: '附件关联资源类型，如 work_item、wiki_page' },
                principal_id: { type: 'string', description: '附件关联资源的ID' },
                page_index: { type: 'integer', description: '页码，从0开始', default: 0 },
                page_size: { type: 'integer', description: '每页数量', default: 100 },
            },
            required: ['principal_type', 'principal_id'],
        },
    },
    {
        name: 'pingcode__get_attachment',
        description: '获取单个附件的详细信息',
        inputSchema: {
            type: 'object',
            properties: {
                attachment_id: { type: 'string', description: '附件ID' },
                principal_type: { type: 'string', description: '附件关联资源类型' },
                principal_id: { type: 'string', description: '附件关联资源ID' },
            },
            required: ['attachment_id', 'principal_type', 'principal_id'],
        },
    },
    {
        name: 'pingcode__weekly_report',
        description: '生成本周工作报告，包括本周更新的工作项、登记的工时明细及汇总',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'pingcode__create_from_prd',
        description: '根据 PRD/需求文档在 PingCode 中创建需求及子任务。' +
            'LLM 应先分析 PRD 内容，将其拆解为可执行的工作项层级结构，然后调用本工具批量创建。' +
            '支持父需求 + 多个子需求的层级嵌套，子需求自动关联到父需求。',
        inputSchema: {
            type: 'object',
            properties: {
                project_id: { type: 'string', description: '项目ID（必填）' },
                title: { type: 'string', description: 'PRD/需求的主标题，如为 Epic 级别的大需求' },
                description: { type: 'string', description: '需求的详细描述（支持 Markdown 格式）' },
                type_id: { type: 'string', description: '主需求类型ID，如 epic, feature, story, task。默认为 story' },
                priority_id: { type: 'string', description: '优先级ID' },
                assignee_id: { type: 'string', description: '负责人ID' },
                sprint_id: { type: 'string', description: '迭代ID' },
                story_points: { type: 'number', description: '故事点' },
                estimated_workload: { type: 'number', description: '预估工时（小时）' },
                children: {
                    type: 'array',
                    description: '子需求列表。LLM 应将复杂 PRD 拆解为多个子需求，每个子需求代表一个可独立交付的功能点。支持嵌套（子需求的 children 字段继续嵌套）',
                    items: {
                        type: 'object',
                        properties: {
                            title: { type: 'string', description: '子需求标题' },
                            description: { type: 'string', description: '子需求描述（Markdown 格式）' },
                            type_id: { type: 'string', description: '子需求类型ID，默认 story' },
                            priority_id: { type: 'string', description: '优先级ID' },
                            assignee_id: { type: 'string', description: '负责人ID' },
                            story_points: { type: 'number', description: '故事点' },
                            estimated_workload: { type: 'number', description: '预估工时（小时）' },
                            children: {
                                type: 'array',
                                description: '子需求的子任务（支持多层嵌套）',
                                items: {
                                    type: 'object',
                                    properties: {
                                        title: { type: 'string', description: '子子需求标题' },
                                        description: { type: 'string', description: '子子需求描述' },
                                        type_id: { type: 'string', description: '类型ID，默认 story' },
                                        priority_id: { type: 'string', description: '优先级ID' },
                                        assignee_id: { type: 'string', description: '负责人ID' },
                                        story_points: { type: 'number', description: '故事点' },
                                        estimated_workload: { type: 'number', description: '预估工时（小时）' },
                                    },
                                    required: ['title'],
                                },
                            },
                        },
                        required: ['title'],
                    },
                },
            },
            required: ['project_id', 'title'],
        },
    },
    {
        name: 'pingcode__list_activities',
        description: '获取指定工作项/测试用例/测试执行/需求/ticket 的活动记录（变更历史）。' +
            '可查询状态变更、字段修改、评论等活动详情。适用于周报摘要、审计追溯等场景。',
        inputSchema: {
            type: 'object',
            properties: {
                principal_type: {
                    type: 'string',
                    description: '主体类型。work_item=工作项, test_case=测试用例, test_run=测试执行, idea=产品需求, ticket=工单',
                    enum: ['work_item', 'test_case', 'test_run', 'idea', 'ticket'],
                },
                principal_id: { type: 'string', description: '主体ID（工作项ID/测试用例ID 等）' },
            },
            required: ['principal_type', 'principal_id'],
        },
    },
];
const TOOL_SCHEMA_MAP = new Map();
for (const tool of TOOLS) {
    TOOL_SCHEMA_MAP.set(tool.name, tool.inputSchema);
}
async function handleToolCall(request) {
    const { name, arguments: args } = request.params;
    try {
        const schema = TOOL_SCHEMA_MAP.get(name);
        if (schema) {
            const validation = validateArgs(name, schema, args);
            if (!validation.success && validation.errors) {
                const errorMsg = validation.errors.join('; ');
                logWarn(`参数校验失败 [${name}]`, { errors: validation.errors, args });
                return {
                    content: [{ type: 'text', text: `参数校验失败：${errorMsg}` }],
                    isError: true,
                };
            }
        }
        switch (name) {
            case 'pingcode__configure_auth': {
                await runAuthSetup();
                return {
                    content: [
                        {
                            type: 'text',
                            text: '认证配置已完成并保存。',
                        },
                    ],
                };
            }
            case 'pingcode__get_myself': {
                const data = await pingCodeClient.get('/v1/myself');
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_team': {
                const data = await pingCodeClient.get('/v1/directory/team');
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_users': {
                const params = new URLSearchParams();
                if (args?.keywords)
                    params.append('keywords', String(args.keywords));
                if (args?.department_ids)
                    params.append('department_ids', String(args.department_ids));
                if (args?.name)
                    params.append('name', String(args.name));
                if (args?.emails)
                    params.append('emails', String(args.emails));
                if (args?.mobiles)
                    params.append('mobiles', String(args.mobiles));
                params.append('page_index', String(args?.page_index ?? 0));
                params.append('page_size', String(args?.page_size ?? 30));
                const query = params.toString() ? `?${params.toString()}` : '';
                const data = await pingCodeClient.get(`/v1/directory/users${query}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_projects': {
                const data = await listProjects({
                    keywords: args?.keywords,
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_project': {
                const data = await getProject(String(args?.project_id));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__create_project': {
                const data = await createProject({
                    name: String(args?.name),
                    type: args?.type_id || 'scrum',
                    description: args?.description,
                    assignee_id: args?.assignee_id,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_work_items': {
                const data = await listWorkItems({
                    identifier: args?.identifier,
                    project_ids: args?.project_ids,
                    type_ids: args?.type_ids,
                    assignee_ids: args?.assignee_ids,
                    state_ids: args?.state_ids,
                    sprint_ids: args?.sprint_ids,
                    keywords: args?.keywords,
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_work_item': {
                const data = await getWorkItem(String(args?.work_item_id));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__create_work_item': {
                const data = await createWorkItem({
                    project_id: String(args?.project_id),
                    type_id: String(args?.type_id),
                    title: String(args?.title),
                    description: args?.description,
                    state_id: args?.state_id,
                    priority_id: args?.priority_id,
                    assignee_id: args?.assignee_id,
                    sprint_id: args?.sprint_id,
                    parent_id: args?.parent_id,
                    story_points: args?.story_points,
                    estimated_workload: args?.estimated_workload,
                    remaining_workload: args?.remaining_workload,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__update_work_item': {
                const data = await updateWorkItem({
                    work_item_id: String(args?.work_item_id),
                    title: args?.title,
                    description: args?.description,
                    state_id: args?.state_id,
                    priority_id: args?.priority_id,
                    assignee_id: args?.assignee_id,
                    sprint_id: args?.sprint_id,
                    parent_id: args?.parent_id,
                    story_points: args?.story_points,
                    estimated_workload: args?.estimated_workload,
                    remaining_workload: args?.remaining_workload,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_sprints': {
                const data = await listSprints({
                    project_id: args?.project_id,
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_sprint': {
                const data = await getSprint(String(args?.sprint_id));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_products': {
                const params = new URLSearchParams();
                if (args?.keywords)
                    params.append('keywords', String(args.keywords));
                params.append('page_index', String(args?.page_index ?? 0));
                params.append('page_size', String(args?.page_size ?? 30));
                const query = params.toString() ? `?${params.toString()}` : '';
                const data = await pingCodeClient.get(`/v1/products${query}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_requirements': {
                const params = new URLSearchParams();
                if (args?.product_id)
                    params.append('product_id', String(args.product_id));
                if (args?.keywords)
                    params.append('keywords', String(args.keywords));
                params.append('page_index', String(args?.page_index ?? 0));
                params.append('page_size', String(args?.page_size ?? 30));
                const query = params.toString() ? `?${params.toString()}` : '';
                const data = await pingCodeClient.get(`/v1/requirements${query}`);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__create_workload': {
                const data = await createWorkload({
                    principal_id: String(args?.principal_id),
                    principal_type: String(args?.principal_type),
                    type_id: String(args?.type_id),
                    duration: Number(args?.duration),
                    report_at: Number(args?.report_at),
                    report_by_id: args?.report_by_id,
                    description: args?.description,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_workloads': {
                const data = await listWorkloads({
                    principal_type: String(args?.principal_type),
                    principal_id: args?.principal_id,
                    start_at: args?.start_at,
                    end_at: args?.end_at,
                    report_by_id: args?.report_by_id,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_workload_types': {
                const data = await listWorkloadTypes();
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__create_comment': {
                const data = await createComment({
                    principal_type: String(args?.principal_type),
                    principal_id: String(args?.principal_id),
                    content: String(args?.content),
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_comments': {
                const data = await listComments({
                    principal_type: String(args?.principal_type),
                    principal_id: String(args?.principal_id),
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_releases': {
                const data = await listReleases({
                    project_id: String(args?.project_id),
                    name: args?.name,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_release': {
                const data = await getRelease(String(args?.release_id));
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_wiki_spaces': {
                const data = await listWikiSpaces({
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_wiki_pages': {
                const data = await listWikiPages({
                    space_id: String(args?.space_id),
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_wiki_page': {
                const data = await getWikiPage({
                    page_id: String(args?.page_id),
                    format_type: args?.format_type || 'markdown',
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__list_attachments': {
                const data = await listAttachments({
                    principal_type: String(args?.principal_type),
                    principal_id: String(args?.principal_id),
                    page_index: args?.page_index,
                    page_size: args?.page_size,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__get_attachment': {
                const data = await getAttachment({
                    attachment_id: String(args?.attachment_id),
                    principal_type: String(args?.principal_type),
                    principal_id: String(args?.principal_id),
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            case 'pingcode__weekly_report': {
                const data = await generateWeeklyReport();
                return {
                    content: [
                        {
                            type: 'text',
                            text: data,
                        },
                    ],
                };
            }
            case 'pingcode__create_from_prd': {
                const data = await createFromPrd({
                    project_id: String(args?.project_id),
                    title: String(args?.title),
                    description: args?.description,
                    type_id: args?.type_id,
                    priority_id: args?.priority_id,
                    assignee_id: args?.assignee_id,
                    sprint_id: args?.sprint_id,
                    story_points: args?.story_points,
                    estimated_workload: args?.estimated_workload,
                    children: args?.children,
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: data,
                        },
                    ],
                };
            }
            case 'pingcode__list_activities': {
                const data = await listActivities({
                    principal_type: String(args?.principal_type),
                    principal_id: String(args?.principal_id),
                });
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(data, null, 2),
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logError(`工具调用失败 [${name}]`, error);
        return {
            content: [
                {
                    type: 'text',
                    text: `Error: ${message}`,
                },
            ],
            isError: true,
        };
    }
}
async function main() {
    const initialized = await tokenManager.initialize();
    if (!initialized) {
        console.error('PingCode MCP Server 启动失败：未找到认证配置。');
        console.error('请先运行配置流程。');
        process.exit(1);
    }
    const server = new Server({
        name: 'pingcode-mcp',
        version: '1.0.0',
    }, {
        capabilities: {
            tools: {},
        },
    });
    server.setRequestHandler(ListToolsRequestSchema, async () => {
        return {
            tools: TOOLS,
        };
    });
    server.setRequestHandler(CallToolRequestSchema, handleToolCall);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('PingCode MCP Server running on stdio');
    logInfo('PingCode MCP Server started', { env: process.env.PINGCODE_LOG_LEVEL || 'info' });
}
main().catch((error) => {
    logError('Fatal error during startup', error);
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map