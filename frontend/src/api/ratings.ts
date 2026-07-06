const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export async function rateMedia(token: string, mediaId: string, value: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/rating`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Failed to rate media: ${res.status}`);
  }
}

export async function getUserRating(token: string, mediaId: string): Promise<number | null> {
  const res = await fetch(`${API_BASE_URL}/media/${mediaId}/rating`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch rating: ${res.status}`);
  }
  return res.json();
}