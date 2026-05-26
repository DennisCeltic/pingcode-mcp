import { pingCodeClient } from '../client/index.js';

export interface PrdChildItem {
  title: string;
  description?: string;
  type_id?: string;
  priority_id?: string;
  assignee_id?: string;
  story_points?: number;
  estimated_workload?: number;
  children?: PrdChildItem[];
}

export interface CreateFromPrdParams {
  project_id: string;
  title: string;
  description?: string;
  type_id?: string;
  priority_id?: string;
  assignee_id?: string;
  sprint_id?: string;
  story_points?: number;
  estimated_workload?: number;
  children?: PrdChildItem[];
}

interface CreatedItem {
  id: string;
  identifier: string;
  title: string;
  html_url: string;
  type_id: string;
  level: number;
}

interface PrdResult {
  parent: CreatedItem;
  children: CreatedItem[];
  summary: string;
}

let idCounter = 0;

async function createSingleWorkItem(params: {
  project_id: string;
  type_id: string;
  title: string;
  description?: string;
  priority_id?: string;
  assignee_id?: string;
  sprint_id?: string;
  parent_id?: string;
  story_points?: number;
  estimated_workload?: number;
}): Promise<{ id: string; identifier: string; title: string; html_url: string }> {
  const body: Record<string, unknown> = {
    project_id: params.project_id,
    type_id: params.type_id,
    title: params.title,
  };
  if (params.description) body.description = params.description;
  if (params.priority_id) body.priority_id = params.priority_id;
  if (params.assignee_id) body.assignee_id = params.assignee_id;
  if (params.sprint_id) body.sprint_id = params.sprint_id;
  if (params.parent_id) body.parent_id = params.parent_id;
  if (params.story_points != null) body.story_points = params.story_points;
  if (params.estimated_workload != null) body.estimated_workload = params.estimated_workload;

  const result = await pingCodeClient.post<{
    id: string;
    identifier: string;
    title: string;
    html_url: string;
  }>('/v1/project/work_items', body);

  return {
    id: result.id,
    identifier: result.identifier,
    title: result.title,
    html_url: result.html_url,
  };
}

async function createChildrenRecursive(
  projectId: string,
  parentId: string,
  children: PrdChildItem[],
  level: number,
  results: CreatedItem[],
  errors: string[],
): Promise<void> {
  for (const child of children) {
    idCounter++;
    try {
      const created = await createSingleWorkItem({
        project_id: projectId,
        type_id: child.type_id || 'story',
        title: `[${idCounter}] ${child.title}`,
        description: child.description,
        priority_id: child.priority_id,
        assignee_id: child.assignee_id,
        parent_id: parentId,
        story_points: child.story_points,
        estimated_workload: child.estimated_workload,
      });

      results.push({
        id: created.id,
        identifier: created.identifier,
        title: child.title,
        html_url: created.html_url,
        type_id: child.type_id || 'story',
        level,
      });

      if (child.children && child.children.length > 0) {
        await createChildrenRecursive(
          projectId,
          created.id,
          child.children,
          level + 1,
          results,
          errors,
        );
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`子需求 "${child.title}" 创建失败: ${msg}`);
    }
  }
}

function buildMarkdownSummary(
  parent: CreatedItem,
  children: CreatedItem[],
  errors: string[],
): string {
  let md = '';

  md += `## PRD 需求创建完成\n\n`;
  md += `### 父需求\n`;
  md += `- **${parent.identifier}**: [${parent.title}](${parent.html_url})\n\n`;

  if (children.length > 0) {
    const typeLabels: Record<string, string> = {
      epic: 'Epic',
      feature: 'Feature',
      story: 'Story',
      task: 'Task',
      bug: 'Bug',
      issue: 'Issue',
    };

    const byLevel = new Map<number, CreatedItem[]>();
    for (const c of children) {
      const list = byLevel.get(c.level) || [];
      list.push(c);
      byLevel.set(c.level, list);
    }

    const sortedLevels = [...byLevel.keys()].sort();
    for (const level of sortedLevels) {
      const items = byLevel.get(level)!;
      const indent = '  '.repeat(level);
      if (level === 1) {
        md += `### 子需求 (${items.length} 个)\n\n`;
      } else if (level === 2) {
        md += `### 子子需求 (${items.length} 个)\n\n`;
      } else {
        md += `### 第 ${level + 1} 层 (${items.length} 个)\n\n`;
      }
      md += `| 编号 | 标题 | 类型 |\n`;
      md += `|------|------|------|\n`;
      for (const item of items) {
        const typeLabel = typeLabels[item.type_id] || item.type_id;
        md += `| ${indent}[${item.identifier}](${item.html_url}) | ${item.title} | ${typeLabel} |\n`;
      }
      md += `\n`;
    }
  }

  md += `### 统计\n`;
  md += `- 父需求: 1 个\n`;
  md += `- 子需求: ${children.length} 个\n`;
  md += `- 总计: ${children.length + 1} 个工作项\n`;

  if (errors.length > 0) {
    md += `\n### ⚠️ 创建失败 (${errors.length} 项)\n`;
    for (const err of errors) {
      md += `- ${err}\n`;
    }
    md += `\n> 💡 建议：请手动检查以上失败项，可通过 PingCode 界面重新创建。\n`;
  } else {
    md += `\n### ✅ 全部创建成功\n`;
    md += `所有 ${children.length + 1} 个工作项均已成功创建，无需手动处理。\n`;
  }

  return md;
}

function buildFailureReport(title: string, error: string): string {
  let md = '';
  md += `## ❌ PRD 需求创建失败\n\n`;
  md += `### 父需求\n`;
  md += `- **${title}**\n\n`;
  md += `### 错误原因\n`;
  md += `\`\`\`\n${error}\n\`\`\`\n\n`;
  md += `### 统计\n`;
  md += `- 父需求: 创建失败\n`;
  md += `- 子需求: 未创建（依赖父需求）\n`;
  md += `- 总计: 0 个工作项被创建\n\n`;
  md += `> 💡 建议：请检查 PingCode 连接和参数配置后重试。\n`;
  return md;
}

export async function createFromPrd(params: CreateFromPrdParams): Promise<string> {
  idCounter = 0;
  const errors: string[] = [];

  let parent: { id: string; identifier: string; title: string; html_url: string };
  try {
    parent = await createSingleWorkItem({
      project_id: params.project_id,
      type_id: params.type_id || 'story',
      title: params.title,
      description: params.description,
      priority_id: params.priority_id,
      assignee_id: params.assignee_id,
      sprint_id: params.sprint_id,
      story_points: params.story_points,
      estimated_workload: params.estimated_workload,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return buildFailureReport(params.title, msg);
  }

  const parentCreated: CreatedItem = {
    id: parent.id,
    identifier: parent.identifier,
    title: params.title,
    html_url: parent.html_url,
    type_id: params.type_id || 'story',
    level: 0,
  };

  const children: CreatedItem[] = [];

  if (params.children && params.children.length > 0) {
    await createChildrenRecursive(
      params.project_id,
      parent.id,
      params.children,
      1,
      children,
      errors,
    );
  }

  return buildMarkdownSummary(parentCreated, children, errors);
}
