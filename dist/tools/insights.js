import { pingCodeClient } from '../client/index.js';
import { listActivities, formatActivitySummary } from './activity.js';
import { listAttachments } from './attachment.js';
import { listComments } from './comment.js';
import { listWorkloads } from './workload.js';
function valueList(data) {
    if (Array.isArray(data))
        return data;
    const dict = data;
    return Array.isArray(dict?.values) ? dict.values : [];
}
function totalOf(data, fallback) {
    const total = data?.total;
    return typeof total === 'number' ? total : fallback;
}
function tsToDate(ts) {
    if (!ts)
        return '-';
    const d = new Date(ts * 1000);
    if (Number.isNaN(d.getTime()))
        return '-';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function daysSince(ts, now = Date.now()) {
    if (!ts)
        return undefined;
    return Math.floor((now - ts * 1000) / 86400000);
}
function nameOf(entity) {
    return entity?.display_name || entity?.name || '-';
}
function stateName(item) {
    return item.state?.name || '-';
}
function isDoneState(name) {
    const normalized = (name || '').toLowerCase();
    return [
        'done',
        'closed',
        'resolved',
        'completed',
        '完成',
        '已完成',
        '关闭',
        '已关闭',
        '已解决',
    ].some((word) => normalized.includes(word));
}
function isBlocked(item) {
    const text = `${item.state?.name || ''} ${item.priority?.name || ''} ${item.title || ''}`.toLowerCase();
    return ['阻塞', 'blocked', 'blocker'].some((word) => text.includes(word));
}
function formatHours(hours) {
    if (typeof hours !== 'number' || Number.isNaN(hours))
        return '-';
    return `${Number(hours.toFixed(1))}h`;
}
function cleanText(value, max = 240) {
    const text = (value || '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!text)
        return '-';
    return text.length > max ? `${text.slice(0, max)}...` : text;
}
function workItemLink(item) {
    const label = item.identifier ? `${item.identifier}: ${item.title}` : item.title;
    return item.html_url ? `[${label}](${item.html_url})` : label;
}
function buildWorkItemQuery(params, pageIndex, pageSize) {
    const query = new URLSearchParams();
    if (params.project_id)
        query.append('project_ids', params.project_id);
    if (params.sprint_id)
        query.append('sprint_ids', params.sprint_id);
    if (params.assignee_ids)
        query.append('assignee_ids', params.assignee_ids);
    if (params.state_ids)
        query.append('state_ids', params.state_ids);
    if (params.type_ids)
        query.append('type_ids', params.type_ids);
    if (params.updated_between)
        query.append('updated_between', params.updated_between);
    query.append('page_index', String(pageIndex));
    query.append('page_size', String(pageSize));
    return query.toString();
}
async function fetchWorkItems(params = {}) {
    const pageSize = Math.min(Math.max(params.page_size ?? 100, 1), 100);
    const maxItems = Math.min(Math.max(params.max_items ?? 500, 1), 2000);
    const items = [];
    let page = 0;
    while (items.length < maxItems) {
        const query = buildWorkItemQuery(params, page, pageSize);
        const data = await pingCodeClient.get(`/v1/project/work_items?${query}`);
        const values = valueList(data);
        items.push(...values);
        const total = totalOf(data, values.length);
        if (values.length === 0 || items.length >= total || values.length < pageSize)
            break;
        page++;
    }
    return items.slice(0, maxItems);
}
function filterDone(items, includeDone) {
    if (includeDone)
        return items;
    return items.filter((item) => !isDoneState(stateName(item)));
}
function sortBySeverity(items, now = Math.floor(Date.now() / 1000)) {
    return [...items].sort((a, b) => {
        const aOverdue = a.end_at && a.end_at < now ? 1 : 0;
        const bOverdue = b.end_at && b.end_at < now ? 1 : 0;
        if (aOverdue !== bOverdue)
            return bOverdue - aOverdue;
        return (a.end_at || Number.MAX_SAFE_INTEGER) - (b.end_at || Number.MAX_SAFE_INTEGER);
    });
}
function tableRows(items, limit = 10) {
    if (items.length === 0)
        return '无\n';
    let out = '| 工作项 | 状态 | 负责人 | 截止 | 最近更新 |\n';
    out += '|---|---|---|---|---|\n';
    for (const item of items.slice(0, limit)) {
        out += `| ${workItemLink(item)} | ${stateName(item)} | ${nameOf(item.assignee)} | ${tsToDate(item.end_at)} | ${tsToDate(item.updated_at)} |\n`;
    }
    if (items.length > limit)
        out += `\n另有 ${items.length - limit} 个未展示。\n`;
    return out;
}
export async function generateProjectHealthReport(params = {}) {
    const allItems = await fetchWorkItems(params);
    const activeItems = filterDone(allItems, params.include_done);
    const nowSec = Math.floor(Date.now() / 1000);
    const staleDays = params.stale_days ?? 7;
    const dueSoonDays = params.due_soon_days ?? 7;
    const dueSoonSec = nowSec + dueSoonDays * 86400;
    const done = allItems.filter((item) => isDoneState(stateName(item)));
    const overdue = activeItems.filter((item) => item.end_at && item.end_at < nowSec);
    const dueSoon = activeItems.filter((item) => item.end_at && item.end_at >= nowSec && item.end_at <= dueSoonSec);
    const unassigned = activeItems.filter((item) => !item.assignee?.id);
    const stale = activeItems.filter((item) => (daysSince(item.updated_at) ?? 0) >= staleDays);
    const blocked = activeItems.filter(isBlocked);
    const stateCount = new Map();
    const assigneeCount = new Map();
    for (const item of allItems) {
        stateCount.set(stateName(item), (stateCount.get(stateName(item)) || 0) + 1);
        const assignee = nameOf(item.assignee);
        assigneeCount.set(assignee, (assigneeCount.get(assignee) || 0) + 1);
    }
    const riskScore = overdue.length * 4 + blocked.length * 3 + dueSoon.length * 2 + unassigned.length * 2 + stale.length;
    const health = riskScore === 0 ? '绿色' : riskScore <= 8 ? '黄色' : '红色';
    let out = `# PingCode 项目健康度报告\n\n`;
    out += `**健康度**: ${health}  \n`;
    out += `**范围**: ${params.project_id ? `项目 ${params.project_id}` : '全部可见项目'}${params.sprint_id ? ` / 迭代 ${params.sprint_id}` : ''}  \n`;
    out += `**样本量**: ${allItems.length} 个工作项（活跃 ${activeItems.length}，完成 ${done.length}）\n\n`;
    out += `## 关键指标\n\n`;
    out += `| 指标 | 数量 |\n|---|---:|\n`;
    out += `| 逾期未完成 | ${overdue.length} |\n`;
    out += `| ${dueSoonDays} 天内到期 | ${dueSoon.length} |\n`;
    out += `| 无负责人 | ${unassigned.length} |\n`;
    out += `| ${staleDays} 天未更新 | ${stale.length} |\n`;
    out += `| 疑似阻塞 | ${blocked.length} |\n\n`;
    out += `## 状态分布\n\n`;
    out += [...stateCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([state, count]) => `- ${state}: ${count}`)
        .join('\n') || '无';
    out += `\n\n## 负责人负载 Top 10\n\n`;
    out += [...assigneeCount.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([assignee, count]) => `- ${assignee}: ${count}`)
        .join('\n') || '无';
    out += `\n\n## 高优先级关注项\n\n`;
    out += `### 逾期未完成\n${tableRows(sortBySeverity(overdue), 8)}\n`;
    out += `### 即将到期\n${tableRows(sortBySeverity(dueSoon), 8)}\n`;
    out += `### 长时间未更新\n${tableRows(stale.sort((a, b) => (a.updated_at || 0) - (b.updated_at || 0)), 8)}\n`;
    out += `\n## 建议动作\n\n`;
    const actions = [];
    if (overdue.length)
        actions.push(`先处理 ${overdue.length} 个逾期项，确认是否延期、拆分或关闭。`);
    if (unassigned.length)
        actions.push(`为 ${unassigned.length} 个无负责人工作项补齐 owner。`);
    if (stale.length)
        actions.push(`对 ${stale.length} 个停滞项发起同步，要求更新状态或阻塞原因。`);
    if (dueSoon.length)
        actions.push(`检查 ${dueSoon.length} 个临期项的验收标准和剩余工作量。`);
    if (actions.length === 0)
        actions.push('当前未发现明显风险，保持例会节奏和交付节奏。');
    out += actions.map((item, index) => `${index + 1}. ${item}`).join('\n');
    return out;
}
export async function summarizeWorkItemContext(params) {
    const item = await pingCodeClient.get(`/v1/project/work_items/${params.work_item_id}`);
    const activityLimit = params.activity_limit ?? 5;
    const commentLimit = params.comment_limit ?? 5;
    let out = `# 工作项上下文摘要\n\n`;
    out += `## 基本信息\n\n`;
    out += `- 工作项: ${workItemLink(item)}\n`;
    out += `- 项目: ${item.project?.name || '-'}\n`;
    out += `- 类型: ${item.type?.name || item.type?.id || '-'}\n`;
    out += `- 状态: ${stateName(item)}\n`;
    out += `- 优先级: ${item.priority?.name || '-'}\n`;
    out += `- 负责人: ${nameOf(item.assignee)}\n`;
    out += `- 迭代: ${item.sprint?.name || '-'}\n`;
    out += `- 计划时间: ${tsToDate(item.start_at)} ~ ${tsToDate(item.end_at)}\n`;
    out += `- 工时: 预估 ${formatHours(item.estimated_workload)} / 剩余 ${formatHours(item.remaining_workload)}\n\n`;
    out += `## 描述摘要\n\n${cleanText(item.description, 800)}\n\n`;
    if (item.parent?.id) {
        out += `## 父级工作项\n\n- ${item.parent.identifier || item.parent.id}: ${item.parent.title || '-'}\n\n`;
    }
    out += `## 最近活动\n\n`;
    try {
        const { values } = await listActivities({ principal_type: 'work_item', principal_id: params.work_item_id });
        out += `${formatActivitySummary(values || [], activityLimit)}\n\n`;
    }
    catch (error) {
        out += `活动记录获取失败: ${error instanceof Error ? error.message : String(error)}\n\n`;
    }
    out += `## 最近评论\n\n`;
    try {
        const comments = valueList(await listComments({ principal_type: 'work_item', principal_id: params.work_item_id }));
        if (comments.length === 0) {
            out += `无评论\n\n`;
        }
        else {
            for (const comment of comments.slice(0, commentLimit)) {
                const creator = comment.created_by;
                out += `- ${tsToDate(comment.created_at)} ${nameOf(creator)}: ${cleanText(String(comment.content || comment.body || ''), 180)}\n`;
            }
            out += `\n`;
        }
    }
    catch (error) {
        out += `评论获取失败: ${error instanceof Error ? error.message : String(error)}\n\n`;
    }
    if (params.include_attachments ?? true) {
        out += `## 附件\n\n`;
        try {
            const attachments = valueList(await listAttachments({
                principal_type: 'work_item',
                principal_id: params.work_item_id,
                page_size: 20,
            }));
            if (attachments.length === 0) {
                out += `无附件\n\n`;
            }
            else {
                for (const attachment of attachments.slice(0, 10)) {
                    out += `- ${String(attachment.name || attachment.filename || attachment.id || '-')}\n`;
                }
                out += `\n`;
            }
        }
        catch (error) {
            out += `附件获取失败: ${error instanceof Error ? error.message : String(error)}\n\n`;
        }
    }
    const risks = [];
    const nowSec = Math.floor(Date.now() / 1000);
    if (!item.assignee?.id)
        risks.push('当前无负责人');
    if (item.end_at && item.end_at < nowSec && !isDoneState(stateName(item)))
        risks.push('已逾期且未完成');
    if ((daysSince(item.updated_at) ?? 0) >= 7 && !isDoneState(stateName(item)))
        risks.push('超过 7 天未更新');
    if (isBlocked(item))
        risks.push('疑似阻塞');
    out += `## AI 接手提示\n\n`;
    out += risks.length > 0
        ? risks.map((risk) => `- ${risk}`).join('\n')
        : '- 暂未发现明显风险，可继续根据最近活动和评论推进。';
    return out;
}
export async function generateTeamLoadReport(params = {}) {
    const items = filterDone(await fetchWorkItems(params), params.include_done);
    const startAt = params.start_at;
    const endAt = params.end_at;
    const byAssignee = new Map();
    const nowSec = Math.floor(Date.now() / 1000);
    const dueSoonSec = nowSec + (params.due_soon_days ?? 7) * 86400;
    const staleDays = params.stale_days ?? 7;
    for (const item of items) {
        const id = item.assignee?.id || 'unassigned';
        const name = nameOf(item.assignee);
        const row = byAssignee.get(id) || {
            id,
            name,
            total: 0,
            overdue: 0,
            dueSoon: 0,
            stale: 0,
            estimated: 0,
            remaining: 0,
            workloads: 0,
        };
        row.total++;
        if (item.end_at && item.end_at < nowSec)
            row.overdue++;
        if (item.end_at && item.end_at >= nowSec && item.end_at <= dueSoonSec)
            row.dueSoon++;
        if ((daysSince(item.updated_at) ?? 0) >= staleDays)
            row.stale++;
        row.estimated += item.estimated_workload || 0;
        row.remaining += item.remaining_workload || 0;
        byAssignee.set(id, row);
    }
    if (startAt && endAt) {
        await Promise.all([...byAssignee.values()].map(async (row) => {
            if (row.id === 'unassigned')
                return;
            try {
                const workloads = valueList(await listWorkloads({
                    principal_type: 'work_item',
                    report_by_id: row.id,
                    start_at: startAt,
                    end_at: endAt,
                }));
                row.workloads = workloads.reduce((sum, wl) => sum + (wl.duration || 0), 0);
            }
            catch {
                row.workloads = 0;
            }
        }));
    }
    const rows = [...byAssignee.values()].sort((a, b) => b.total - a.total);
    let out = `# 团队负载报告\n\n`;
    out += `**范围**: ${params.project_id ? `项目 ${params.project_id}` : '全部可见项目'}${params.sprint_id ? ` / 迭代 ${params.sprint_id}` : ''}  \n`;
    out += `**活跃工作项**: ${items.length}\n\n`;
    out += `| 成员 | 活跃项 | 逾期 | 临期 | 停滞 | 预估 | 剩余 | 已登记工时 |\n`;
    out += `|---|---:|---:|---:|---:|---:|---:|---:|\n`;
    for (const row of rows) {
        out += `| ${row.name} | ${row.total} | ${row.overdue} | ${row.dueSoon} | ${row.stale} | ${formatHours(row.estimated)} | ${formatHours(row.remaining)} | ${startAt && endAt ? formatHours(row.workloads) : '-'} |\n`;
    }
    out += `\n## 负载提示\n\n`;
    const avg = rows.length ? items.length / rows.length : 0;
    const hints = rows
        .filter((row) => row.total >= Math.ceil(avg * 1.5) && row.total >= 3)
        .map((row) => `- ${row.name} 当前活跃项 ${row.total} 个，高于团队平均 ${avg.toFixed(1)}。`);
    const riskOwners = rows
        .filter((row) => row.overdue || row.stale)
        .slice(0, 8)
        .map((row) => `- ${row.name}: 逾期 ${row.overdue}，停滞 ${row.stale}。`);
    out += [...hints, ...riskOwners].join('\n') || '当前未发现明显负载倾斜。';
    return out;
}
export async function scanDeliveryRisks(params = {}) {
    const items = filterDone(await fetchWorkItems(params), params.include_done);
    const nowSec = Math.floor(Date.now() / 1000);
    const staleDays = params.stale_days ?? 7;
    const dueSoonSec = nowSec + (params.due_soon_days ?? 7) * 86400;
    const risks = [];
    for (const item of items) {
        if (item.end_at && item.end_at < nowSec) {
            risks.push({ level: '高', type: '逾期', item, reason: `截止于 ${tsToDate(item.end_at)}，当前状态为 ${stateName(item)}` });
        }
        if (isBlocked(item)) {
            risks.push({ level: '高', type: '阻塞', item, reason: '标题、状态或优先级中出现阻塞信号' });
        }
        if (!item.assignee?.id) {
            risks.push({ level: '中', type: '无负责人', item, reason: '缺少明确 owner，容易丢失跟进责任' });
        }
        if (item.end_at && item.end_at >= nowSec && item.end_at <= dueSoonSec) {
            risks.push({ level: '中', type: '临期', item, reason: `${tsToDate(item.end_at)} 到期` });
        }
        if ((daysSince(item.updated_at) ?? 0) >= staleDays) {
            risks.push({ level: '低', type: '停滞', item, reason: `${daysSince(item.updated_at)} 天未更新` });
        }
    }
    const levelRank = { '高': 3, '中': 2, '低': 1 };
    risks.sort((a, b) => levelRank[b.level] - levelRank[a.level]);
    let out = `# 交付风险扫描\n\n`;
    out += `**扫描工作项**: ${items.length}  \n`;
    out += `**风险信号**: ${risks.length}\n\n`;
    out += `| 等级 | 类型 | 工作项 | 负责人 | 原因 |\n`;
    out += `|---|---|---|---|---|\n`;
    for (const risk of risks.slice(0, 30)) {
        out += `| ${risk.level} | ${risk.type} | ${workItemLink(risk.item)} | ${nameOf(risk.item.assignee)} | ${risk.reason} |\n`;
    }
    if (risks.length === 0)
        out += `| - | - | - | - | 未发现明显风险 |\n`;
    if (risks.length > 30)
        out += `\n另有 ${risks.length - 30} 条风险信号未展示。\n`;
    out += `\n## 建议处理顺序\n\n`;
    out += `1. 高风险项当天确认处理人、处理路径和新截止时间。\n`;
    out += `2. 中风险项在下一次站会或周例会上确认 owner 与完成标准。\n`;
    out += `3. 低风险停滞项要求补充状态更新，必要时关闭无效任务。\n`;
    return out;
}
//# sourceMappingURL=insights.js.map