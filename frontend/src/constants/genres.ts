export const GENRES = [
  'action',
  'adventure',
  'animation',
  'comedy',
  'crime',
  'documentary',
  'drama',
  'family',
  'fantasy',
  'history',
  'horror',
  'music',
  'mystery',
  'romance',
  'sci-fi',
  'thriller',
  'war',
  'western',
] as const;

export type Genre = (typeof GENRES)[number];

/**
 * Mirrors backend/src/common/enums/genre.enum.ts GENRE_KEYWORDS.
 * Keep in sync manually since frontend/backend are separate packages.
 */
export const GENRE_KEYWORDS: Record<Genre, string[]> = {
  action: ['action', 'fight', 'explosion', 'stunt', 'martial arts'],
  adventure: ['adventure', 'quest', 'expedition', 'journey', 'survival'],
  animation: ['animation', 'cartoon', 'anime'],
  comedy: ['comedy', 'sitcom', 'parody'],
  crime: ['crime', 'mystery', 'murder', 'detectives'],
  documentary: ['documentary', 'biopic', 'docuseries'],
  drama: ['drama', 'melodrama', 'tragedy'],
  family: ['family', 'kids'],
  fantasy: ['fantasy', 'magic', 'sword and sorcery', 'mythical'],
  history: ['history', 'period piece', 'war epic'],
  horror: ['horror', 'slasher', 'supernatural', 'zombie', 'monster'],
  music: ['music', 'musical', 'concert', 'band'],
  mystery: ['mystery', 'whodunit', 'detective', 'crime', 'conspiracy'],
  romance: ['romance', 'love story', 'romantic comedy'],
  'sci-fi': ['sci-fi', 'space', 'alien', 'dystopia'],
  thriller: ['thriller', 'suspense', 'psychological', 'heist'],
  war: ['war', 'military', 'battle', 'war epic'],
  western: ['western', 'cowboy', 'outlaw', 'frontier'],
};

/** Every unique keyword across all genres, alphabetically sorted, for the interest picker UI. */
export const INTEREST_KEYWORDS: string[] = Array.from(
  new Set(Object.values(GENRE_KEYWORDS).flat()),
).sort((a, b) => a.localeCompare(b));

/** Reverse lookup: keyword -> the genre(s) it belongs to. */
export const KEYWORD_TO_GENRES: Record<string, Genre[]> = GENRES.reduce(
  (map, genre) => {
    for (const keyword of GENRE_KEYWORDS[genre]) {
      map[keyword] = [...(map[keyword] ?? []), genre];
    }
    return map;
  },
  {} as Record<string, Genre[]>,
);
