export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function parseResponse<T>(response: Response): Promise<T> {
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