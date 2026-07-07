import type { AgeRestriction, Media, Season } from '../types/media';
import { API_BASE_URL } from './client';

export type MediaItem = Media;

export async function fetchMedia(): Promise<Media[]> {
  const res = await fetch(`${API_BASE_URL}/media`);
  if (!res.ok) {
    throw new Error(`Failed to fetch media: ${res.status}`);
  }
  return res.json();
}

export interface SearchMediaParams {
  query?: string;
  genre?: string;
  interests?: string[];
}

export async function searchMedia(params: SearchMediaParams): Promise<Media[]> {
  const searchParams = new URLSearchParams();
  const trimmedQuery = params.query?.trim();
  if (trimmedQuery) {
    searchParams.set('q', trimmedQuery);
  }
  if (params.genre) {
    searchParams.set('genre', params.genre);
  }
  if (params.interests?.length) {
    searchParams.set('interests', params.interests.join(','));
  }

  const res = await fetch(`${API_BASE_URL}/media/search?${searchParams.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to search media: ${res.status}`);
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
    ageRestriction: AgeRestriction;
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

export async function updateMedia(
  token: string,
  id: string,
  data: Partial<{
    name: string;
    releaseDate: string;
    description: string;
    genreIds: string[];
    interestIds?: string[];
    interestNames?: string[];
    ageRestriction: AgeRestriction;
    durationMinutes: number;
    posterUrl: string;
  }>,
): Promise<Media> {
  const res = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to update media: ${res.status}`);
  }
  return res.json();
}

export async function deleteMedia(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/media/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to delete media: ${res.status}`);
  }
}

export interface CreateEpisodePayload {
  seasonNum: number;
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

export async function fetchSeasons(mediaId: string): Promise<Season[]> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/seasons`);
  if (!res.ok) {
    throw new Error(`Failed to fetch seasons: ${res.status}`);
  }
  return res.json();
}

export async function addSeason(
  token: string,
  mediaId: string,
  firstEpisodeTitle: string,
): Promise<Season> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/seasons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ title: firstEpisodeTitle }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to add season: ${res.status}`);
  }
  return res.json();
}

export interface EpisodeWatchStatusEntry {
  episodeId: string;
  watched: boolean;
}

export interface SeasonWatchStatusEntry {
  seasonId: string;
  seasonNum: number;
  watched: boolean;
}

export async function getEpisodeWatchStatuses(
  token: string,
  mediaId: string,
): Promise<EpisodeWatchStatusEntry[]> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/episode-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch episode watch statuses: ${res.status}`);
  }
  return res.json();
}

export async function getSeasonWatchStatuses(
  token: string,
  mediaId: string,
): Promise<SeasonWatchStatusEntry[]> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/season-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch season watch statuses: ${res.status}`);
  }
  return res.json();
}

export async function setEpisodeWatchStatus(
  token: string,
  episodeId: string,
  watched: boolean,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/media/episodes/${episodeId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ watched }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to update episode status: ${res.status}`);
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
  const data: { status: string } = await res.json();
  return data.status;
}