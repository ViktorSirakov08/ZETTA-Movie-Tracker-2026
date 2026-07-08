import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../lib/auth-storage';
import { postComment } from '../api/comments';

export function CommentForm({ mediaId, onPosted }: { mediaId: string; onPosted: () => void; }) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = getToken();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('You must be logged in to post comments.');
      return;
    }
    if (!content.trim()) {
      setError('Comment cannot be empty.');
      return;
    }
    setSubmitting(true);
    try {
      await postComment(token, mediaId, content.trim());
      setContent('');
      onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="comment-form-notice">
        <p>
          <Link to="/login">Log in</Link> to post a comment.
        </p>
      </div>
    );
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <div className="form-error-banner">{error}</div>}
      <textarea
        rows={3}
        placeholder="Add a public comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="comment-form-actions">
        <button type="submit" className="action-button action-button--primary" disabled={submitting}>
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </div>
    </form>
  );
}
