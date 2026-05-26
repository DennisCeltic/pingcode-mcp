export interface CreateCommentParams {
    principal_type: string;
    principal_id: string;
    content: string;
}
export interface ListCommentsParams {
    principal_type: string;
    principal_id: string;
}
export declare function createComment(params: CreateCommentParams): Promise<unknown>;
export declare function listComments(params: ListCommentsParams): Promise<unknown>;
export declare function getComment(commentId: string, principal_type?: string, principal_id?: string): Promise<unknown>;
export declare function deleteComment(commentId: string): Promise<unknown>;
//# sourceMappingURL=comment.d.ts.map