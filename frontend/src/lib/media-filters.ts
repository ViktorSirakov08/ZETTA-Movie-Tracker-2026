import type { Media } from '../types/media';

/**
 * Scopes Elasticsearch search results down to a specific local list (e.g. a
 * user's watched items or watchlist), while preserving the relevance order
 * Elasticsearch already computed.
 */
export function intersectByRelevance(searchResults: Media[], scope: Media[]): Media[] {
  const scopeIds = new Set(scope.map((item) => item.id));
  return searchResults.filter((item) => scopeIds.has(item.id));
}