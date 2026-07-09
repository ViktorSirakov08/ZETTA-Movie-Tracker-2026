import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import '../components/forms.css';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';

// Reset tokens are single-use server-side too, but marking them used
// locally lets us skip straight to the "already used" state on a second
// click of the same email link, instead of showing the form again and
// only failing once the user submits it.
const USED_TOKENS_KEY = 'usedResetTokens';

function isTokenAlreadyUsed(token: string): boolean {
  const used = JSON.parse(localStorage.getItem(USED_TOKENS_KEY) ?? '[]') as string[];
  return used.includes(token);
}

function markTokenAsUsed(token: string): void {
  const used = JSON.parse(localStorage.getItem(USED_TOKENS_KEY) ?? '[]') as string[];
  if (!used.includes(token)) {
    localStorage.setItem(USED_TOKENS_KEY, JSON.stringify([...used, token]));
  }
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hashParams.get('token') ?? searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyUsed] = useState(() => Boolean(token) && isTokenAlreadyUsed(token));
  const [completed, setCompleted] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword({ token, password });
      markTokenAsUsed(token);
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
      setCompleted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (completed || alreadyUsed) {
    return (
      <AuthLayout
        quote="Use a new password that is memorable to you and hard for everyone else."
        quoteAuthor="Create a new password"
      >
        <h1 className="auth-title">Create new password</h1>

        <div className="auth-form">
          {completed ? (
            <div className="form-success-banner">{message}</div>
          ) : (
            <div className="form-error-banner">
              This reset link has already been used. Request a new one if you still need to
              reset your password.
            </div>
          )}
        </div>

        <p className="auth-switch">
          {completed ? (
            <Link to="/login">Log in</Link>
          ) : (
            <Link to="/forgot-password">Request a new link</Link>
          )}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      quote="Use a new password that is memorable to you and hard for everyone else."
      quoteAuthor="Create a new password"
    >
      <h1 className="auth-title">Create new password</h1>
      <p className="auth-subtitle">Enter and confirm your new password</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}

        <PasswordInput
          label="New password"
          autoComplete="new-password"
          placeholder="Create a new password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save new password'}
        </button>
      </form>

      <p className="auth-switch">
        Password reset? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
