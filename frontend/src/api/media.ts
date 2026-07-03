import { API_BASE_URL, parseResponse } from './client';

export interface MediaGenre {
  id: string;
  name: string;
}

export interface MediaItem {
  id: string;
  type: 'MOVIE' | 'SERIES';
  name: string;
  releaseDate: string;
  rating: number | null;
  description: string;
  genres: MediaGenre[];
  ageRestricted: boolean;
  durationMinutes: number | null;
  posterUrl: string | null;
}

export function getAllMedia(): Promise<MediaItem[]> {
  return fetch(`${API_BASE_URL}/media`).then((res) =>
    parseResponse<MediaItem[]>(res),
  );
}

export function getWatchHistory(token: string): Promise<MediaItem[]> {
  return fetch(`${API_BASE_URL}/media/history`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => parseResponse<MediaItem[]>(res));
}