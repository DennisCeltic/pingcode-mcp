import { pingCodeClient } from '../client/index.js';

export interface AddProductMembersParams {
  product_id: string;
  user_ids: string[];
  role_id?: string;
}

export async function addProductMembers(params: AddProductMembersParams) {
  const results: unknown[] = [];
  for (const uid of params.user_ids) {
    const body: { user_id: string; role_id?: string } = { user_id: uid };
    if (params.role_id) body.role_id = params.role_id;
    const result = await pingCodeClient.post(
      `/v1/ship/products/${params.product_id}/members`,
      body,
    );
    results.push(result);
  }
  return results.length === 1 ? results[0] : results;
}
