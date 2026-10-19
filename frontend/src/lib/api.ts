import { AskResponse, DocumentInfo } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://citizen-ai-backend-12xf.onrender.com';

// ── Existing endpoints ───────────────────────────────────────────────────────

export async function askQuestion(
  query: string,
  category?: string,
  conversation_id: string = 'web-session',
  doc_ids?: string[],
  scope: string = 'library'
): Promise<AskResponse & { offer_library_search?: boolean }> {
  const res = await fetch(`${API_BASE_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      category: category === 'all' ? null : category,
      conversation_id,
      mode: 'hybrid',
      doc_ids: doc_ids || null,
      scope,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server returned ${res.status}`);
  }

  return res.json();
}

export async function submitFeedback(
  query: string,
  response: string,
  feedback_type: 'thumbs_up' | 'thumbs_down',
  comment: string = ''
) {
  try {
    await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        response,
        feedback_type,
        comment,
      }),
    });
  } catch (err) {
    console.error('Failed to submit feedback:', err);
  }
}

export async function fetchDocuments(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/documents`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.documents || [];
  } catch (err) {
    console.error('Failed to fetch documents:', err);
    return [];
  }
}

// ── Attachment endpoints ─────────────────────────────────────────────────────

export interface AttachmentInfo {
  doc_id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  file_size: number;
  page_count: number | null;
  message?: string;
}

export interface AttachmentStatus {
  doc_id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  progress: number;
  page_count: number | null;
  chunks_created: number;
  error: string | null;
  expires_in_hours: number | null;
}

export async function uploadAttachment(
  file: File,
  conversationId: string = 'web-session'
): Promise<AttachmentInfo> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('conversation_id', conversationId);

  const res = await fetch(`${API_BASE_URL}/upload/attach`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Upload failed with status ${res.status}`);
  }

  return res.json();
}

export async function pollAttachmentStatus(docId: string): Promise<AttachmentStatus> {
  const res = await fetch(`${API_BASE_URL}/upload/attach/${docId}/status`);
  if (!res.ok) {
    throw new Error(`Status check failed for ${docId}`);
  }
  return res.json();
}

export async function deleteAttachment(docId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/upload/attach/${docId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Delete failed');
  }
}

export async function addToLibrary(docId: string, category: string = 'general'): Promise<void> {
  const formData = new FormData();
  formData.append('category', category);

  const res = await fetch(`${API_BASE_URL}/upload/attach/${docId}/add-to-library`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Add to library failed');
  }
}
