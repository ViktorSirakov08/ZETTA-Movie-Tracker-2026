import { useEffect, useState } from 'react';
import { searchMedia } from '../api/media';
import type { Media } from '../types/media';

const SEARCH_DEBOUNCE_MS = 300;

export interface UseMediaSearchParams {
  query: string;
  genre?: string;
  interests?: string[];
}

/**
 * Debounced Elasticsearch-backed search. Returns `results: null` when there is
 * no active query/genre/interest filter (callers should fall back to their
 * own unfiltered list). Ignores responses for a request that's since been
 * superseded, so a slow response for stale params can't clobber state after
 * the user keeps typing, clears the box, or changes a filter.
 */
export function useMediaSearch({ query, genre, interests }: UseMediaSearchParams) {
  const [results, setResults] = useState<Media[] | null>(null);
  const [searching, setSearching] = useState(false);

  const trimmedQuery = query.trim();
  const hasInterests = Boolean(interests?.length);
  // Array identity isn't stable across renders — key on contents instead so
  // the effect doesn't refire every render when `interests` is freshly built.
  const interestsKey = interests?.slice().sort().join(',') ?? '';
  const isActive = trimmedQuery.length > 0 || Boolean(genre) || hasInterests;

  useEffect(() => {
    if (!isActive) {
      setResults(null);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timeoutId = setTimeout(() => {
      searchMedia({ query: trimmedQuery, genre, interests })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmedQuery, genre, interestsKey, isActive]);

  return { results, searching };
}