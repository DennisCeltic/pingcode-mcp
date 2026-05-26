export interface AddProductMembersParams {
    product_id: string;
    user_ids: string[];
    role_id?: string;
}
export declare function addProductMembers(params: AddProductMembersParams): Promise<unknown>;
//# sourceMappingURL=product.d.ts.map