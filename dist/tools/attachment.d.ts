export interface ListAttachmentsParams {
    principal_type: string;
    principal_id: string;
    page_index?: number;
    page_size?: number;
}
export interface GetAttachmentParams {
    attachment_id: string;
    principal_type: string;
    principal_id: string;
}
export declare function listAttachments(params: ListAttachmentsParams): Promise<unknown>;
export declare function getAttachment(params: GetAttachmentParams): Promise<unknown>;
//# sourceMappingURL=attachment.d.ts.map