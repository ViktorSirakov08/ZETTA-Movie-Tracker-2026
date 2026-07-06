import { useEffect, useState } from 'react';
import { searchMedia } from '../api/media';
import type { Media } from '../types/media';

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Debounced Elasticsearch-backed search. Returns `results: null` when there is
 * no active query (callers should fall back to their own unfiltered list).
 * Ignores responses for a query that's since been superseded, so a slow
 * request for a stale query can't clobber state after the user keeps typing
 * or clears the box.
 */
export function useMediaSearch(query: string) {
  const [results, setResults] = useState<Media[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length === 0) {
      setResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timeoutId = setTimeout(() => {
      searchMedia(trimmed)
        .then((matches) => {
          if (!cancelled) setResults(matches);
        })
        .catch(() => {
          if (!cancelled) setResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  return { results, searching };
}