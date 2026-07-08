import { useEffect } from 'react';
import { refreshAccessToken } from '../api/auth';
import { clearSession, getRefreshToken, saveTokens } from '../lib/auth-storage';

// Access tokens are short-lived (15m) on purpose — this is what keeps a
// session alive silently instead of the user hitting a dead token mid-use.
// Runs well inside that window so it always renews before expiry.
const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function useSilentTokenRefresh(): void {
  useEffect(() => {
    const intervalId = setInterval(() => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return;

      refreshAccessToken(refreshToken)
        .then(({ accessToken, refreshToken: nextRefreshToken }) => {
          saveTokens(accessToken, nextRefreshToken);
        })
        .catch(() => {
          // Refresh token itself is invalid/expired/revoked — nothing left
          // to silently renew with. Clear the session; whichever protected
          // page the user is on will redirect to /login on its next render.
          clearSession();
        });
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
}