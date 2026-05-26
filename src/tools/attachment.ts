import { pingCodeClient } from '../client/index.js';

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

export async function listAttachments(params: ListAttachmentsParams) {
  const query = new URLSearchParams();
  query.append('principal_type', params.principal_type);
  query.append('principal_id', params.principal_id);
  query.append('page_index', String(params.page_index ?? 0));
  query.append('page_size', String(params.page_size ?? 100));

  return pingCodeClient.get(`/v1/attachments?${query}`);
}

export async function getAttachment(params: GetAttachmentParams) {
  const query = new URLSearchParams();
  query.append('principal_type', params.principal_type);
  query.append('principal_id', params.principal_id);
  return pingCodeClient.get(`/v1/attachments/${params.attachment_id}?${query}`);
}
