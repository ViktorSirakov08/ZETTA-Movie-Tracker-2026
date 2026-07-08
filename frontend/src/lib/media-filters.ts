import type { Media } from '../types/media';

export function intersectByRelevance(searchResults: Media[], scope: Media[]): Media[] {
  const scopeIds = new Set(scope.map((item) => item.id));
  return searchResults.filter((item) => scopeIds.has(item.id));
}