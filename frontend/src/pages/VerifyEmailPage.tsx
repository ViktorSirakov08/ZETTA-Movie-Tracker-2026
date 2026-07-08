import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import '../components/forms.css';
import { verifyEmail } from '../api/auth';
import { ApiError } from '../api/client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const token = hashParams.get('token') ?? searchParams.get('token') ?? '';
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Verification token is missing.');
      return;
    }

    verifyEmail(token)
      .then((result) => setMessage(result.message))
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Unable to verify email.'),
      );
  }, [token]);

  return (
    <AuthLayout
      quote="Verification keeps account recovery tied to a real inbox."
      quoteAuthor="Email verification"
    >
      <h1 className="auth-title">Verify email</h1>
      <p className="auth-subtitle">Confirming your account</p>

      <div className="auth-form">
        {error && <div className="form-error-banner">{error}</div>}
        {message && <div className="form-success-banner">{message}</div>}
      </div>

      <p className="auth-switch">
        <Link to="/login">Go to login</Link>
      </p>
    </AuthLayout>
  );
}
