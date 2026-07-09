import type { Comment } from '../types/comment';
import { API_BASE_URL } from './client';

export async function fetchComments(mediaId: string): Promise<Comment[]> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/comments`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to fetch comments: ${res.status}`);
  }
  return res.json();
}

export async function postComment(token: string | null, mediaId: string, content: string): Promise<Comment> {
  if (!token) {
    throw new Error('Authentication required to post comments.');
  }
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to post comment: ${res.status}`);
  }
  return res.json();
}

export async function deleteComment(token: string | null, mediaId: string, commentId: string): Promise<void> {
  if (!token) {
    throw new Error('Authentication required to delete comments.');
  }
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to delete comment: ${res.status}`);
  }
}
