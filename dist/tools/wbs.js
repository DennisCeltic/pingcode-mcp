import { pingCodeClient } from '../client/index.js';
const STAGE_TYPE_ID = '624dab0cb4c7e3d7db4aa981';
const MILESTONE_TYPE_ID = '6499b1a4b00b437502b85bb7';
const TASK_TYPE_ID = 'task';
async function createWorkItem(body) {
    const result = await pingCodeClient.post('/v1/project/work_items', body);
    return result;
}
function buildSummary(result, errors) {
    let md = '';
    md += `## WBS 分解创建完成\n\n`;
    if (result.stages.length > 0) {
        md += `### 阶段 (${result.stages.length} 个)\n`;
        md += `| 编号 | 标题 |\n`;
        md += `|------|------|\n`;
        for (const s of result.stages) {
            md += `| [${s.identifier}](${s.html_url}) | ${s.title} |\n`;
        }
        md += `\n`;
    }
    if (result.milestones.length > 0) {
        md += `### 里程碑 (${result.milestones.length} 个)\n`;
        md += `| 编号 | 标题 |\n`;
        md += `|------|------|\n`;
        for (const m of result.milestones) {
            md += `| [${m.identifier}](${m.html_url}) | ${m.title} |\n`;
        }
        md += `\n`;
    }
    if (result.tasks.length > 0) {
        md += `### 任务 (${result.tasks.length} 个)\n`;
        md += `| 编号 | 标题 |\n`;
        md += `|------|------|\n`;
        for (const t of result.tasks) {
            md += `| [${t.identifier}](${t.html_url}) | ${t.title} |\n`;
        }
        md += `\n`;
    }
    const total = result.stages.length + result.milestones.length + result.tasks.length;
    md += `### 统计\n`;
    md += `- 阶段: ${result.stages.length} 个\n`;
    md += `- 里程碑: ${result.milestones.length} 个\n`;
    md += `- 任务: ${result.tasks.length} 个\n`;
    md += `- 总计: ${total} 个工作项\n`;
    if (errors.length > 0) {
        md += `\n### ⚠️ 创建失败 (${errors.length} 项)\n`;
        for (const err of errors) {
            md += `- ${err}\n`;
        }
        md += `\n> 💡 建议：请手动检查以上失败项，可通过 PingCode 界面重新创建。\n`;
    }
    else {
        md += `\n### ✅ 全部创建成功\n`;
        md += `所有 ${total} 个工作项均已成功创建，无需手动处理。\n`;
    }
    return md;
}
export async function createFromWbs(params) {
    const errors = [];
    const stages = [];
    const milestones = [];
    const tasks = [];
    for (const stage of params.stages) {
        let stageId;
        try {
            const stageBody = {
                project_id: params.project_id,
                type_id: STAGE_TYPE_ID,
                title: stage.title,
                start_at: stage.start_at,
                end_at: stage.end_at,
            };
            if (stage.description)
                stageBody.description = stage.description;
            if (params.assignee_id)
                stageBody.assignee_id = params.assignee_id;
            const created = await createWorkItem(stageBody);
            stageId = created.id;
            stages.push({
                id: created.id,
                identifier: created.identifier,
                title: stage.title,
                html_url: created.html_url,
                type: '阶段',
            });
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`阶段 "${stage.title}" 创建失败: ${msg}`);
            continue;
        }
        for (const milestone of stage.milestones || []) {
            let msId;
            try {
                const msBody = {
                    project_id: params.project_id,
                    type_id: MILESTONE_TYPE_ID,
                    title: milestone.title,
                    parent_id: stageId,
                    end_at: milestone.end_at,
                };
                if (milestone.description)
                    msBody.description = milestone.description;
                if (params.assignee_id)
                    msBody.assignee_id = params.assignee_id;
                const created = await createWorkItem(msBody);
                msId = created.id;
                milestones.push({
                    id: created.id,
                    identifier: created.identifier,
                    title: milestone.title,
                    html_url: created.html_url,
                    type: '里程碑',
                });
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`里程碑 "${milestone.title}" 创建失败: ${msg}`);
                continue;
            }
            for (const task of milestone.tasks || []) {
                await createTaskWithPhase(params.project_id, stageId, task, tasks, errors, params.assignee_id);
            }
        }
        for (const task of stage.tasks || []) {
            await createTaskWithPhase(params.project_id, stageId, task, tasks, errors, params.assignee_id);
        }
    }
    const result = { stages, milestones, tasks, summary: '' };
    result.summary = buildSummary(result, errors);
    return result.summary;
}
async function createTaskWithPhase(projectId, phaseId, task, tasks, errors, assigneeId) {
    try {
        const body = {
            project_id: projectId,
            type_id: TASK_TYPE_ID,
            title: task.title,
        };
        if (task.description)
            body.description = task.description;
        if (task.start_at != null)
            body.start_at = task.start_at;
        if (task.end_at != null)
            body.end_at = task.end_at;
        if (assigneeId)
            body.assignee_id = assigneeId;
        if (task.assignee_id)
            body.assignee_id = task.assignee_id;
        const created = await createWorkItem(body);
        await pingCodeClient.patch(`/v1/project/work_items/${created.id}`, {
            phase_id: phaseId,
        });
        tasks.push({
            id: created.id,
            identifier: created.identifier,
            title: task.title,
            html_url: created.html_url,
            type: '任务',
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`任务 "${task.title}" 创建失败: ${msg}`);
    }
}
//# sourceMappingURL=wbs.js.map