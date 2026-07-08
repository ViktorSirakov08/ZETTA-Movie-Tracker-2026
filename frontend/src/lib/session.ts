import { refreshAccessToken } from '../api/auth';
import { clearSession, getRefreshToken, getToken, saveTokens } from './auth-storage';

// Refresh a little before actual expiry, not exactly at it — covers the
// time between reading the token and the request actually reaching the
// server (network latency, slow devices, etc.).
const EXPIRY_BUFFER_MS = 30_000;

function getTokenExpiryMs(token: string): number | null {
  try {
    const payloadSegment = token.split('.')[1];
    const base64 = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Multiple components can ask for a valid token around the same moment
// (e.g. a page firing several requests on mount) — without this, each one
// would kick off its own refresh call. Sharing one in-flight promise means
// only the first caller actually hits /auth/refresh; the rest just await it.
let refreshInFlight: Promise<string | null> | null = null;

// Called right before making an authenticated request, not on a timer.
// Returns the current access token as-is if it's still comfortably valid,
// or transparently refreshes it first if it's expired/about to expire.
// Returns null if there's no session, or the refresh token itself is dead
// (caller should treat that the same as "not logged in").
export async function getValidAccessToken(): Promise<string | null> {
  const token = getToken();
  if (!token) return null;

  const expiryMs = getTokenExpiryMs(token);
  const isExpiringSoon = expiryMs === null || expiryMs - Date.now() < EXPIRY_BUFFER_MS;
  if (!isExpiringSoon) {
    return token;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearSession();
    return null;
  }

  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken(refreshToken)
      .then(({ accessToken, refreshToken: nextRefreshToken }) => {
        saveTokens(accessToken, nextRefreshToken);
        return accessToken;
      })
      .catch(() => {
        clearSession();
        return null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}