import { pingCodeClient } from '../client/index.js';
export async function addProductMembers(params) {
    const results = [];
    for (const uid of params.user_ids) {
        const body = { user_id: uid };
        if (params.role_id)
            body.role_id = params.role_id;
        const result = await pingCodeClient.post(`/v1/ship/products/${params.product_id}/members`, body);
        results.push(result);
    }
    return results.length === 1 ? results[0] : results;
}
//# sourceMappingURL=product.js.map