const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function fetchGenres() {
  const res = await fetch(`${API_BASE_URL}/genres`);
  if (!res.ok) throw new Error(`Failed to fetch genres: ${res.status}`);
  return res.json();
}