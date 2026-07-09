import type { Interest } from '../constants/interests';
import { API_BASE_URL, parseResponse } from './client';

export interface AuthUser {
  id: string;
  username: string;
  email: string | null;
  emailVerified: boolean;
  dateOfBirth: string;
  role: 'user' | 'admin';
  interests: Interest[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function registerUser(data: {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  interests: Interest[];
}): Promise<AuthUser> {
  return fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => parseResponse<AuthUser>(res));
}

export function loginUser(data: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => parseResponse<LoginResponse>(res));
}

export function getMe(token: string): Promise<AuthUser> {
  return fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => parseResponse<AuthUser>(res));
}

export function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  return fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((res) => parseResponse<TokenPair>(res));
}

export function logoutUser(refreshToken: string): Promise<void> {
  return fetch(`${API_BASE_URL}/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  }).then((res) => parseResponse<void>(res));
}

export function requestPasswordReset(email: string): Promise<{ message: string }> {
  return fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then((res) => parseResponse<{ message: string }>(res));
}

export function resetPassword(data: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  return fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((res) => parseResponse<{ message: string }>(res));
}

export function verifyEmail(token: string): Promise<{ message: string }> {
  const params = new URLSearchParams({ token });
  return fetch(`${API_BASE_URL}/auth/verify-email?${params.toString()}`).then((res) =>
    parseResponse<{ message: string }>(res),
  );
}

export function resendVerification(email: string): Promise<{ message: string }> {
  return fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  }).then((res) => parseResponse<{ message: string }>(res));
}

export function updateProfile(
  token: string,
  data: { username?: string; interests?: Interest[] },
): Promise<AuthUser> {
  return fetch(`${API_BASE_URL}/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  }).then((res) => parseResponse<AuthUser>(res));
}
