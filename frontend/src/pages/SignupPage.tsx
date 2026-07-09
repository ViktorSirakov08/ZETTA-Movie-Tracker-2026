import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { PasswordInput } from '../components/PasswordInput';
import { InterestPicker } from '../components/InterestPicker';
import '../components/forms.css';
import { registerUser } from '../api/auth';
import { ApiError } from '../api/client';
import { INTERESTS, INTEREST_LABELS } from '../constants/interests';

export function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) {
        next.delete(interest);
      } else {
        next.add(interest);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const interests = Array.from(selectedInterests);

    setSubmitting(true);
    try {
      await registerUser({ username, email, password, dateOfBirth, interests });
      setSuccess('Account created. Check your email to verify your account before logging in.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign up.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      quote="Join thousands of movie and series fans building their watchlist."
      quoteAuthor="Create your account"
    >
      <h1 className="auth-title">Create account</h1>
      <p className="auth-subtitle">Sign up to get started</p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}
        {success && <div className="form-success-banner">{success}</div>}

        <div className="field">
          <label htmlFor="username">Username</label>
          <div className="field-input-wrap">
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="field-input-wrap">
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <PasswordInput
          label="Confirm Password"
          autoComplete="new-password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          minLength={8}
          required
        />

        <div className="field">
          <label htmlFor="dob">Date of Birth</label>
          <div className="field-input-wrap">
            <input
              id="dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label>Interests</label>
          <InterestPicker
            selectedKeywords={selectedInterests}
            onToggle={toggleInterest}
            keywords={INTERESTS}
            labels={INTEREST_LABELS}
          />
        </div>

        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Signing up...' : 'Sign Up'}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthLayout>
  );
}
