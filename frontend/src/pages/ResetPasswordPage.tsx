import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import '../components/forms.css';
import { resetPassword } from '../api/auth';
import { ApiError } from '../api/client';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hashParams.get('token') ?? searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setMessage(result.message);
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
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
        {message && <div className="form-success-banner">{message}</div>}

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
