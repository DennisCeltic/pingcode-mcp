export interface ListWikiSpacesParams {
    page_index?: number;
    page_size?: number;
}
export interface ListWikiPagesParams {
    space_id: string;
    page_index?: number;
    page_size?: number;
}
export interface GetWikiPageParams {
    page_id: string;
    format_type?: 'markdown' | 'html';
}
export declare function listWikiSpaces(params?: ListWikiSpacesParams): Promise<unknown>;
export declare function listWikiPages(params: ListWikiPagesParams): Promise<unknown>;
export declare function getWikiPage(params: GetWikiPageParams): Promise<unknown>;
export interface AddWikiMembersParams {
    space_id: string;
    user_ids: string[];
    role_id?: string;
}
export declare function addWikiMembers(params: AddWikiMembersParams): Promise<unknown>;
//# sourceMappingURL=wiki.d.ts.map