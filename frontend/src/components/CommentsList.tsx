import { useEffect, useState } from 'react';
import { fetchComments } from '../api/comments';
import type { Comment } from '../types/comment';
import { CommentForm } from './CommentForm';
import './CommentsList.css';

export function CommentsList({ mediaId }: { mediaId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchComments(mediaId);
      setComments(data);
    } catch (err) {
      const raw = err instanceof Error ? err.message : '';
      const friendly =
        raw.includes('Cannot GET') ||
        raw.includes('Failed to fetch') ||
        raw.includes('connect')
          ? 'Comments are temporarily unavailable.'
          : raw || 'Failed to load comments.';
      setError(friendly);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [mediaId]);

  return (
    <section className="comments-section">
      <h3>Comments</h3>
      <CommentForm mediaId={mediaId} onPosted={load} />

      {loading && <p>Loading comments...</p>}
      {error && <div className="form-error-banner">{error}</div>}
      {comments && comments.length === 0 && <p>No comments yet. Be the first to comment.</p>}
      {comments && comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id} className="comment-item">
              <div className="comment-meta">
                <strong>{c.user?.username ?? 'Unknown'}</strong>
                <span className="comment-date">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <div className="comment-body">{c.content}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
