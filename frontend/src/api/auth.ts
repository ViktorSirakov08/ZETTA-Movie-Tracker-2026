import type { Genre } from '../constants/genres';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export interface AuthUser {
  id: string;
  username: string;
  dateOfBirth: string;
  role: 'user' | 'admin';
  interests: Genre[];
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      (body && Array.isArray(body.message) && body.message.join(', ')) ||
      'Something went wrong. Please try again.';
    throw new ApiError(message, response.status);
  }

  return body as T;
}

export function registerUser(data: {
  username: string;
  password: string;
  dateOfBirth: string;
  interests: Genre[];
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
