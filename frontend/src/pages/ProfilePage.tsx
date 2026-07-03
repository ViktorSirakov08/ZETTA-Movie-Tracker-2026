import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { InterestPicker } from '../components/InterestPicker';
import '../components/forms.css';
import { ApiError, getMe, updateProfile, type AuthUser } from '../api/auth';
import { clearSession, getToken, updateStoredUser } from '../lib/auth-storage';
import { KEYWORD_TO_GENRE, type Genre } from '../constants/genres';

export function ProfilePage() {
  const token = getToken();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [username, setUsername] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set(),
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }
    getMe(token)
      .then((fresh) => {
        setUser(fresh);
        setUsername(fresh.username);
        setSelectedKeywords(new Set(fresh.interests));
      })
      .catch(() => {
        setError('Unable to load your profile.');
      });
  }, [token]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    clearSession();
    window.location.href = '/login';
  }

  function toggleKeyword(keyword: string) {
    setSelectedKeywords((prev) => {
      const next = new Set(prev);
      if (next.has(keyword)) {
        next.delete(keyword);
      } else {
        next.add(keyword);
      }
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    const interests: Genre[] = Array.from(
      new Set(
        Array.from(selectedKeywords)
          .map((keyword) => KEYWORD_TO_GENRE[keyword])
          .filter((genre): genre is Genre => Boolean(genre)),
      ),
    );

    setSubmitting(true);
    try {
      const updated = await updateProfile(token as string, {
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
              <span className="field-icon" aria-hidden="true">
                👤
              </span>
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
              <span className="field-icon" aria-hidden="true">
                🎂
              </span>
              <input type="text" value={user?.dateOfBirth ?? ''} disabled />
            </div>
          </div>
        </div>

        <div className="field">
          <label>Interests</label>
          <InterestPicker
            selectedKeywords={selectedKeywords}
            onToggle={toggleKeyword}
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
