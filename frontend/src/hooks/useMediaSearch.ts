import { useEffect, useState } from 'react';
import { searchMedia } from '../api/media';
import type { Media } from '../types/media';

const SEARCH_DEBOUNCE_MS = 300;

export interface UseMediaSearchParams {
  query: string;
  genre?: string;
  interests?: string[];
}

export function useMediaSearch({ query, genre, interests }: UseMediaSearchParams) {
  const [results, setResults] = useState<Media[] | null>(null);
  const [searching, setSearching] = useState(false);

  const trimmedQuery = query.trim();
  const hasInterests = Boolean(interests?.length);
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
  }, [trimmedQuery, genre, interestsKey, isActive]);

  return { results, searching };
}