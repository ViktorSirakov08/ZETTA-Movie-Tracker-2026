import type { Media } from '../types/media';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function fetchMedia(): Promise<Media[]> {
  const res = await fetch(`${API_BASE_URL}/media`);
  if (!res.ok) {
    throw new Error(`Failed to fetch media: ${res.status}`);
  }
  return res.json();
}

export async function createMedia(  
  token: string,
  data: {
    type: 'MOVIE' | 'SERIES';
    name: string;
    releaseDate: string;
    description: string;
    genreIds: string[];
    ageRestricted: boolean;
    durationMinutes?: number;
    posterUrl?: string;
  },
): Promise<Media> {
  const res = await fetch(`${API_BASE_URL}/media`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create media: ${res.status}`);
  }
  return res.json();
}