import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { InterestPicker } from '../components/InterestPicker';
import '../components/forms.css';
import { getMe, logoutUser, updateProfile, type AuthUser } from '../api/auth';
import { ApiError } from '../api/client';
import {
  clearSession,
  getRefreshToken,
  getToken,
  updateStoredUser,
} from '../lib/auth-storage';
import { getValidAccessToken } from '../lib/session';
import { INTERESTS, INTEREST_LABELS } from '../constants/interests';

export function ProfilePage() {
  const token = getToken();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    getValidAccessToken()
      .then((validToken) => {
        if (!validToken) {
          throw new Error('Your session has expired. Please log in again.');
        }
        return getMe(validToken);
      })
      .then((fresh) => {
        setUser(fresh);
        setUsername(fresh.username);
        setSelectedInterests(new Set(fresh.interests));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load your profile.');
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  async function handleLogout() {
    const refreshToken = getRefreshToken();
    // Best-effort — if this fails (network hiccup, already expired), the
    // user still gets logged out locally; the refresh token just lingers
    // in the DB until it expires on its own instead of being revoked early.
    if (refreshToken) {
      await logoutUser(refreshToken).catch(() => {});
    }
    clearSession();
    window.location.href = '/login';
  }

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
    setSuccess(false);

    const interests = Array.from(selectedInterests);

    setSubmitting(true);
    try {
      const validToken = await getValidAccessToken();
      if (!validToken) {
        throw new Error('Your session has expired. Please log in again.');
      }
      const updated = await updateProfile(validToken, {
        username,
        interests,
      });
      setUser(updated);
      updateStoredUser(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save changes.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      variant="profile"
      quote="Your taste in movies says a lot about you. Keep it up to date."
      quoteAuthor="Your profile"
    >
      <Link to="/home" className="back-link">
        ← Back to Home
      </Link>

      <h1 className="auth-title">Your profile</h1>
      <p className="auth-subtitle">
        Update your username and pick what you're into
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="form-error-banner">{error}</div>}
        {success && <div className="form-success-banner">Profile updated!</div>}

        <div className="field-row">
          <div className="field">
            <label htmlFor="username">Username</label>
            <div className="field-input-wrap">
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field">
            <label>Date of birth</label>
            <div className="field-input-wrap">
              <input type="text" value={user?.dateOfBirth ?? ''} disabled />
            </div>
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
          {submitting ? 'Saving...' : 'Save changes'}
        </button>

        <button className="btn-secondary" type="button" onClick={handleLogout}>
          Log out
        </button>
      </form>
    </AuthLayout>
  );
}
