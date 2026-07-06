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
  const byName = new Map(genres.map((genre) => [genre.name, genre]));

  for (const name of genreNames) {
    if (!byName.has(name)) {
      const created = await createGenre(name);
      byName.set(name, created);
    }
  }

  return genreNames.map((name) => {
    const genre = byName.get(name);
    if (!genre) {
      throw new Error(`Genre "${name}" could not be resolved.`);
    }
    return genre.id;
  });
}
