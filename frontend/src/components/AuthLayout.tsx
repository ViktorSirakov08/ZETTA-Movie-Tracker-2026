import type { ReactNode } from 'react';
import './AuthLayout.css';

interface AuthLayoutProps {
  quote: string;
  quoteAuthor: string;
  children: ReactNode;
  variant?: 'auth' | 'profile';
}

export function AuthLayout({
  quote,
  quoteAuthor,
  children,
  variant = 'auth',
}: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-illustration">
          <div className="auth-illustration-circle auth-illustration-circle--light" />
          <div className="auth-illustration-circle auth-illustration-circle--dark" />
          <div className="auth-brand">
            <span className="auth-brand-mark" aria-hidden="true">
              🎬
            </span>
            <span className="auth-brand-name">
              <strong>Movie</strong>Tracker
            </span>
          </div>

          {variant === 'profile' ? (
            <div className="auth-illustration-center" aria-hidden="true">
              <span className="auth-floating-chip auth-floating-chip--1">
                🎯 Your Picks
              </span>
              <span className="auth-floating-chip auth-floating-chip--2">
                🔔 Stay Updated
              </span>
              <div className="auth-illustration-orb">
                <span>🍿</span>
              </div>
              <span className="auth-floating-chip auth-floating-chip--3">
                🎨 Personalize
              </span>
            </div>
          ) : (
            <div className="auth-illustration-center" aria-hidden="true">
              <span className="auth-floating-chip auth-floating-chip--1">
                ▶ Now Playing
              </span>
              <span className="auth-floating-chip auth-floating-chip--2">
                ★ 4.8 Rating
              </span>
              <div className="auth-illustration-orb">
                <span>🍿</span>
              </div>
              <span className="auth-floating-chip auth-floating-chip--3">
                📺 New Episodes
              </span>
            </div>
          )}

          <blockquote className="auth-quote">
            <p>&ldquo;{quote}&rdquo;</p>
            <cite>{quoteAuthor}</cite>
          </blockquote>
        </div>

        <div className="auth-form-panel">{children}</div>
      </div>
    </div>
  );
}
