import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import '../components/forms.css';
import { requestPasswordReset } from '../api/auth';
import { ApiError } from '../api/client';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to request password reset.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      quote="A reset link gets you back to your watchlist without weakening account security."
      quoteAuthor="Password reset"
    >
      <h1 className="auth-title">Reset password</h1>
      <p className="auth-subtitle">Enter your email to receive a reset link</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}
        {message && <div className="form-success-banner">{message}</div>}

        <div className="field">
          <label htmlFor="reset-email">Email</label>
          <div className="field-input-wrap">
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-switch">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
