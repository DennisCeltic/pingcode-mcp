import { pingCodeClient } from '../client/index.js';

export interface ListActivitiesParams {
  principal_type: 'work_item' | 'test_case' | 'test_run' | 'idea' | 'ticket';
  principal_id: string;
}

export interface ActivityRecord {
  id: string;
  template: string;
  type: string;
  summary: string;
  created_at: number;
  created_by: {
    id: string;
    name: string;
    display_name: string;
  };
  content?: {
    property_key?: string;
    origin?: { duration?: number | null; unit?: string };
    target?: { duration?: number | null; unit?: string };
  };
}

export function listActivities(params: ListActivitiesParams): Promise<{ values: ActivityRecord[] }> {
  const query = new URLSearchParams();
  query.append('principal_type', params.principal_type);
  query.append('principal_id', params.principal_id);

  return pingCodeClient.get(`/v1/activities?${query.toString()}`);
}

export function formatActivitySummary(activities: ActivityRecord[], maxItems: number = 3): string {
  if (!activities || activities.length === 0) {
    return '无活动记录';
  }

  const recent = activities.slice(0, maxItems);

  const parts: string[] = [];
  for (const act of recent) {
    const ts = new Date(act.created_at * 1000);
    const time = `${ts.getMonth() + 1}/${ts.getDate()} ${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}`;
    const by = act.created_by?.display_name || act.created_by?.name || '未知';

    if (act.template === 'update-workload-property' && act.content) {
      const key = act.content.property_key || '工时';
      const oldVal = act.content.origin?.duration;
      const newVal = act.content.target?.duration;
      parts.push(`[${time}] ${by} ${act.summary}: ${key} ${oldVal ?? 0}h → ${newVal ?? 0}h`);
    } else {
      parts.push(`[${time}] ${by} ${act.summary}`);
    }
  }

  if (parts.length === 0) {
    return '无活动记录';
  }

  return parts.join('  \n');
}
