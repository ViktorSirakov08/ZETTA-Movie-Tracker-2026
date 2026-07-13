import { API_BASE_URL } from './client';
import type { Genre } from '../types/genre';

export async function fetchGenres(): Promise<Genre[]> {
  const res = await fetch(`${API_BASE_URL}/genres`);
  if (!res.ok) throw new Error(`Failed to fetch genres: ${res.status}`);
  return res.json();
}

export async function createGenre(name: string): Promise<Genre> {
  const res = await fetch(`${API_BASE_URL}/genres`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to create genre: ${res.status}`);
  }
  return res.json();
}

export async function ensureGenreIds(genreNames: string[]): Promise<string[]> {
  const genres = await fetchGenres();
  // Case-insensitive: the DB treats genre names as case-insensitive-unique
  // (see GenreService.create), but our fixed GENRE_NAMES list is lowercase
  // while some existing genres are Title Case — an exact-case lookup here
  // would miss them and try to recreate a "new" duplicate that the backend
  // then correctly rejects.
  const byLowerName = new Map(genres.map((genre) => [genre.name.toLowerCase(), genre]));

  for (const name of genreNames) {
    const lowerName = name.toLowerCase();
    if (!byLowerName.has(lowerName)) {
      const created = await createGenre(name);
      byLowerName.set(lowerName, created);
    }
  }

  return genreNames.map((name) => {
    const genre = byLowerName.get(name.toLowerCase());
    if (!genre) {
      throw new Error(`Genre "${name}" could not be resolved.`);
    }
    return genre.id;
  });
}
