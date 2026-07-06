import type { Media } from '../types/media';
import { API_BASE_URL } from './client';

export type MediaItem = Media;

export async function fetchMedia(): Promise<Media[]> {
  const res = await fetch(`${API_BASE_URL}/media`);
  if (!res.ok) {
    throw new Error(`Failed to fetch media: ${res.status}`);
  }
  return res.json();
}

async function fetchMediaListWithAuth(
  path: string,
  token: string,
  failureLabel: string,
): Promise<Media[]> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to fetch ${failureLabel}: ${res.status}`);
  }

  return res.json();
}

export async function fetchMediaById(id: string): Promise<Media> {
  const res = await fetch(`${API_BASE_URL}/media/${id}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch media: ${res.status}`);
  }
  return res.json();
}

export function getWatchHistory(token: string): Promise<Media[]> {
  return fetchMediaListWithAuth('/media/history', token, 'watch history');
}

export function getWatchlist(token: string): Promise<Media[]> {
  return fetchMediaListWithAuth('/media/watchlist', token, 'watchlist');
}

export function getCurrentlyWatching(token: string): Promise<Media[]> {
  return fetchMediaListWithAuth('/media/watching', token, 'currently watching list');
}

export async function createMedia(
  token: string,
  data: {
    type: 'MOVIE' | 'SERIES';
    name: string;
    releaseDate: string;
    description: string;
    genreIds: string[];
    interestIds?: string[];
    interestNames?: string[];
    ageRestricted: boolean;
    ageRestricted13: boolean;
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

export interface CreateEpisodePayload {
  seasonNum: number;
  episodeNum: number;
  title: string;
}

export async function addEpisode(
  token: string,
  mediaId: string,
  data: CreateEpisodePayload,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/episodes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to add episode: ${res.status}`);
  }
}

export async function setWatchStatus(
  token: string,
  mediaId: string,
  status: 'NOT_WATCHED' | 'PLANNED_TO_WATCH' | 'WATCHING' | 'WATCHED',
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to update status: ${res.status}`);
  }
}

export async function getWatchStatus(
  token: string,
  mediaId: string,
): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch watch status: ${res.status}`);
  }
  return res.json();
}