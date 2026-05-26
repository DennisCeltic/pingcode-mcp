import { pingCodeClient } from '../client/index.js';
import { listWorkloads, listWorkloadTypes } from './workload.js';
import { listActivities, formatActivitySummary } from './activity.js';
function getWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };
    return {
        startAt: Math.floor(monday.getTime() / 1000),
        endAt: Math.floor(sunday.getTime() / 1000),
        monday: fmt(monday),
        sunday: fmt(sunday),
    };
}
function tsToDateStr(ts) {
    const d = new Date(ts * 1000);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}
function tsToTimeStr(ts) {
    const d = new Date(ts * 1000);
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
}
function formatReviewState(state) {
    const map = {
        'no_review': '未审核',
        'approved': '已通过',
        'rejected': '已驳回',
        'pending': '待审核',
    };
    return map[state] || state || '-';
}
function formatHours(duration) {
    if (duration >= 1) {
        return `${Number(duration.toFixed(1))}h`;
    }
    const minutes = duration * 60;
    return `${Math.round(minutes)}m`;
}
export async function generateWeeklyReport() {
    const week = getWeekRange();
    let headerName = '企业';
    let myId;
    try {
        const myself = await pingCodeClient.get('/v1/myself');
        headerName = myself.display_name || myself.name;
        myId = myself.id;
    }
    catch {
        try {
            const team = await pingCodeClient.get('/v1/directory/team');
            headerName = team.name || '企业';
        }
        catch {
            /* ignore */
        }
    }
    let report = `# 周报: ${headerName}\n`;
    report += `**周期**: ${week.monday} ~ ${week.sunday}\n\n`;
    const workItemMap = new Map();
    // 1a. 本周 updated_at 落在范围内的工作项（不限负责人）
    let page = 0;
    while (true) {
        const data = await pingCodeClient.get(`/v1/project/work_items?updated_between=${week.startAt},${week.endAt}&page_index=${page}&page_size=100`);
        for (const item of data.values) {
            workItemMap.set(item.id, {
                id: item.id,
                identifier: item.identifier,
                title: item.title,
                projectName: item.project?.name || '',
                stateName: item.state?.name || '',
                source: 'update',
                detail: `${tsToDateStr(item.updated_at)} ${tsToTimeStr(item.updated_at)}`,
                htmlUrl: item.html_url || '',
            });
        }
        if ((page + 1) * 100 >= data.total)
            break;
        page++;
    }
    // 1b. 本周登记了工时的工作项（仅用户令牌模式）
    if (myId) {
        try {
            const workloadsForWIs = await listWorkloads({
                principal_type: 'work_item',
                report_by_id: myId,
                start_at: week.startAt,
                end_at: week.endAt,
            });
            const wlValues = workloadsForWIs.values || [];
            for (const wl of wlValues) {
                const p = wl.principal;
                if (!p?.id || workItemMap.has(p.id))
                    continue;
                try {
                    const wi = await pingCodeClient.get(`/v1/project/work_items/${p.id}`);
                    workItemMap.set(p.id, {
                        id: p.id,
                        identifier: p.identifier,
                        title: p.title,
                        projectName: wi.project?.name || '',
                        stateName: wi.state?.name || '',
                        source: 'workload',
                        detail: `登记 ${formatHours(wl.duration)}`,
                        htmlUrl: p.html_url || '',
                    });
                }
                catch {
                    workItemMap.set(p.id, {
                        id: p.id,
                        identifier: p.identifier,
                        title: p.title,
                        projectName: '',
                        stateName: '',
                        source: 'workload',
                        detail: `登记 ${formatHours(wl.duration)}`,
                        htmlUrl: p.html_url || '',
                    });
                }
            }
        }
        catch { /* ignore */ }
    }
    const workItems = [...workItemMap.values()];
    // ============ 1. 本周摘要（前置，优先展示） ============
    report += `---\n## 一、本周摘要\n\n`;
    report += buildSummary(workItems, week);
    // ============ 2. 近期变更动态 ============
    const DYNAMIC_COUNT = 5;
    report += `---\n## 二、近期变更动态（最近更新的 ${DYNAMIC_COUNT} 个工作项）\n\n`;
    const recentItems = [...workItemMap.values()]
        .sort((a, b) => {
        const getTs = (d) => {
            const parts = d.split(' ');
            return parts.length === 2 ? new Date(`${parts[0]}T${parts[1]}:00`).getTime() : 0;
        };
        return getTs(b.detail) - getTs(a.detail);
    })
        .slice(0, DYNAMIC_COUNT);
    let activityCount = 0;
    for (const item of recentItems) {
        try {
            const { values: activities } = await listActivities({
                principal_type: 'work_item',
                principal_id: item.id,
            });
            if (activities && activities.length > 0) {
                const summary = formatActivitySummary(activities, 3);
                const title = item.htmlUrl
                    ? `[${item.identifier}: ${item.title}](${item.htmlUrl})`
                    : `${item.identifier}: ${item.title}`;
                report += `**${title}**  \n${summary.replace(/\n/g, '  \n')}\n\n`;
                activityCount++;
            }
        }
        catch {
            /* skip items where activities API fails */
        }
    }
    if (activityCount === 0) {
        report += `本周无变更活动记录。\n\n`;
    }
    // ============ 3. 本周登记的工时 ============
    if (myId) {
        report += `---\n## 三、本周工时明细\n\n`;
        try {
            const workloadTypesData = await listWorkloadTypes();
            const typeMap = {};
            if (Array.isArray(workloadTypesData)) {
                for (const t of workloadTypesData) {
                    typeMap[t.id] = t.name;
                }
            }
            const workloads = await listWorkloads({
                principal_type: 'work_item',
                report_by_id: myId,
                start_at: week.startAt,
                end_at: week.endAt,
            });
            const workloadList = workloads.values || [];
            const total = workloads.total || workloadList.length;
            if (total === 0) {
                report += `本周没有登记的工时记录。\n\n`;
            }
            else {
                let totalDuration = 0;
                const projectMap = {};
                await Promise.all(workloadList.map(async (wl) => {
                    if (wl.principal?.id && !projectMap[wl.principal.id]) {
                        try {
                            const wi = await pingCodeClient.get(`/v1/project/work_items/${wl.principal.id}`);
                            projectMap[wl.principal.id] = wi.project?.name || '-';
                        }
                        catch {
                            projectMap[wl.principal.id] = '-';
                        }
                    }
                }));
                report += `| 日期 | 工时 | 工作项编号 | 工作项名称 | 所属项目 | 审核状态 | 备注 |\n`;
                report += `|------|------|-----------|------------|----------|----------|------|\n`;
                for (const wl of workloadList) {
                    const duration = wl.duration || 0;
                    totalDuration += duration;
                    const desc = (wl.description || '').replace(/<[^>]*>/g, '').substring(0, 40) || '-';
                    const reviewState = formatReviewState(wl.review_state || '');
                    const p = wl.principal;
                    const identifier = p?.identifier
                        ? `[${p.identifier}](${p.html_url || ''})`
                        : '-';
                    const title = p?.title || '-';
                    const projectName = projectMap[p?.id || ''] || '-';
                    report += `| ${tsToDateStr(wl.report_at)} | ${formatHours(duration)} | ${identifier} | ${title} | ${projectName} | ${reviewState} | ${desc} |\n`;
                }
                report += `\n`;
                report += `**工时汇总**: 本周共登记 **${formatHours(totalDuration)}** (${totalDuration >= 1 ? Number(totalDuration.toFixed(1)) + ' 小时' : Math.round(totalDuration * 60) + ' 分钟'})\n`;
                report += `**登记次数**: ${total} 条\n\n`;
            }
        }
        catch (error) {
            report += `工时数据获取失败: ${error instanceof Error ? error.message : String(error)}\n\n`;
        }
    }
    // ============ 4. 工作项完整列表（置后，可能截断） ============
    report += `---\n## 四、工作项完整列表（共 ${workItems.length} 个）\n\n`;
    if (workItems.length === 0) {
        report += `本周没有涉及的工作项。\n\n`;
    }
    else {
        report += `| 编号 | 标题 | 项目 | 状态 | 备注 |\n`;
        report += `|------|------|------|------|------|\n`;
        for (const item of workItems) {
            const title = item.htmlUrl
                ? `[${item.title}](${item.htmlUrl})`
                : item.title;
            const note = item.source === 'update' ? `更新于 ${item.detail}` : item.detail;
            report += `| ${item.identifier} | ${title} | ${item.projectName} | ${item.stateName} | ${note} |\n`;
        }
    }
    report += `\n> 由 PingCode MCP 自动生成`;
    return report;
}
function extractDomain(identifier, projectName) {
    const upper = identifier.toUpperCase();
    if (upper.startsWith('IOV'))
        return '🚗 IOV（车载）';
    if (upper.startsWith('IOT'))
        return '🏠 IOT（物联网）';
    if (upper.startsWith('RDZC'))
        return '🔬 RD（研究）';
    if (upper.startsWith('SC'))
        return '⚡ 深聪智能';
    if (upper.startsWith('CBZ'))
        return '🏢 CBZ（一鸣）';
    if (upper.startsWith('SW'))
        return '📋 事务管理';
    const projectUpper = projectName.toUpperCase();
    if (projectUpper.includes('IOV') || projectUpper.includes('日产') || projectUpper.includes('五菱') || projectUpper.includes('瑞驰') || projectUpper.includes('大众') || projectUpper.includes('大通'))
        return '🚗 IOV（车载）';
    if (projectUpper.includes('IOT') || projectUpper.includes('联想') || projectUpper.includes('矩阵麦') || projectUpper.includes('美的'))
        return '🏠 IOT（物联网）';
    if (projectUpper.includes('RD') || projectUpper.includes('研究'))
        return '🔬 RD（研究）';
    if (projectUpper.includes('深聪') || projectUpper.includes('SOLAR'))
        return '⚡ 深聪智能';
    return '📦 其他';
}
function buildSummary(items, week) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isToday = (d) => d.startsWith(todayStr);
    const domainMap = new Map();
    const stateTotal = new Map();
    let todayTotal = 0;
    const highlights = [];
    for (const item of items) {
        const domain = extractDomain(item.identifier, item.projectName);
        let d = domainMap.get(domain);
        if (!d) {
            d = { total: 0, states: new Map(), todayCount: 0 };
            domainMap.set(domain, d);
        }
        d.total++;
        d.states.set(item.stateName, (d.states.get(item.stateName) || 0) + 1);
        stateTotal.set(item.stateName, (stateTotal.get(item.stateName) || 0) + 1);
        const datePart = item.detail.split(' ')[0];
        if (isToday(datePart)) {
            d.todayCount++;
            todayTotal++;
        }
        if (item.stateName === '重新打开') {
            highlights.push(`⚠️ **${item.identifier}** 被重新打开: ${item.title}`);
        }
    }
    let summary = '';
    // 整体概览
    summary += `### 📊 整体概览\n\n`;
    summary += `- 本周共涉及 **${items.length}** 个工作项\n`;
    summary += `- 今日（${todayStr}）有更新: **${todayTotal}** 个\n\n`;
    // 按项目域分布
    summary += `### 📂 按项目域分布\n\n`;
    summary += `| 项目域 | 工作项数 | 今日更新 | 状态分布 |\n`;
    summary += `|--------|----------|----------|----------|\n`;
    const sortedDomains = [...domainMap.entries()].sort((a, b) => b[1].total - a[1].total);
    for (const [domain, data] of sortedDomains) {
        const stateParts = [...data.states.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([s, c]) => `${s}(${c})`);
        const stateStr = stateParts.join(' / ') || '-';
        summary += `| ${domain} | ${data.total} | ${data.todayCount > 0 ? data.todayCount : '-'} | ${stateStr} |\n`;
    }
    summary += `\n`;
    // 状态统计
    summary += `### 📈 状态统计\n\n`;
    const sortedStates = [...stateTotal.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    for (const [state, count] of sortedStates) {
        const pct = items.length > 0 ? ((count / items.length) * 100).toFixed(0) : '0';
        summary += `- ${state}: **${count}** 个 (${pct}%)\n`;
    }
    summary += `\n`;
    // 关键事件
    if (highlights.length > 0) {
        summary += `### ⚠️ 值得关注\n\n`;
        for (const h of highlights.slice(0, 5)) {
            summary += `- ${h}\n`;
        }
        summary += `\n`;
    }
    // 今日重点
    if (todayTotal > 0) {
        summary += `### 🔥 今日重点（${todayStr}）\n\n`;
        const todayItems = items.filter(i => isToday(i.detail.split(' ')[0])).slice(0, 10);
        for (const item of todayItems) {
            const time = item.detail.split(' ')[1] || '';
            const link = item.htmlUrl ? `[${item.identifier}](${item.htmlUrl})` : item.identifier;
            summary += `- ${time ? `[${time}] ` : ''}${link} **${item.stateName}** - ${item.title.substring(0, 60)}${item.title.length > 60 ? '...' : ''}\n`;
        }
        summary += `\n`;
    }
    return summary;
}
//# sourceMappingURL=report.js.map