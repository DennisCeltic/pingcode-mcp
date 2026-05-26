import { pingCodeClient } from '../client/index.js';
export async function createWorkload(params) {
    return pingCodeClient.post('/v1/workloads', params);
}
export async function listWorkloads(params) {
    const query = new URLSearchParams();
    query.append('principal_type', params.principal_type);
    if (params.principal_id)
        query.append('principal_id', params.principal_id);
    if (params.start_at)
        query.append('start_at', String(params.start_at));
    if (params.end_at)
        query.append('end_at', String(params.end_at));
    if (params.report_by_id)
        query.append('report_by_id', params.report_by_id);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return pingCodeClient.get(`/v1/workloads${queryString}`);
}
export async function getWorkload(workloadId) {
    return pingCodeClient.get(`/v1/workloads/${workloadId}`);
}
export async function updateWorkload(params) {
    const { workload_id, ...body } = params;
    return pingCodeClient.patch(`/v1/workloads/${workload_id}`, body);
}
export async function deleteWorkload(workloadId) {
    return pingCodeClient.delete(`/v1/workloads/${workloadId}`);
}
export async function listWorkloadTypes() {
    return pingCodeClient.get('/v1/workload_types');
}
//# sourceMappingURL=workload.js.map