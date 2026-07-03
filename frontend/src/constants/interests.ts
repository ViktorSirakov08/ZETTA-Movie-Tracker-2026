export const INTERESTS = [
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

export type Interest = (typeof INTERESTS)[number];

export const INTEREST_LABELS: Record<Interest, string> = {
  action: 'Action',
  adventure: 'Adventure',
  animation: 'Animation',
  comedy: 'Comedy',
  crime: 'Crime',
  documentary: 'Documentary',
  drama: 'Drama',
  family: 'Family',
  fantasy: 'Fantasy',
  history: 'History',
  horror: 'Horror',
  music: 'Music',
  mystery: 'Mystery',
  romance: 'Romance',
  'sci-fi': 'Sci-Fi',
  thriller: 'Thriller',
  war: 'War',
  western: 'Western',
};

/**
 * Mirrors backend/src/common/enums/interest.enum.ts INTEREST_KEYWORDS.
 * Keep in sync manually since frontend/backend are separate packages.
 */
export const INTEREST_KEYWORDS: Record<Interest, string[]> = {
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

/** Every unique keyword across all interests, alphabetically sorted, for the interest picker UI. */
export const ALL_INTEREST_KEYWORDS: string[] = Array.from(
  new Set(Object.values(INTEREST_KEYWORDS).flat()),
).sort((a, b) => a.localeCompare(b));

/**
 * Reverse lookup: keyword -> the single interest it represents in the picker UI.
 * Some keywords appear under more than one interest in INTEREST_KEYWORDS (e.g. "mystery"
 * is listed under both crime and mystery) - that's fine for backend recommendation
 * matching, but for a UI where clicking one button should select exactly one interest,
 * each keyword must resolve to exactly one interest. An interest's own name always wins
 * that interest (pass 1); everything else is assigned first-come (pass 2).
 */
export const KEYWORD_TO_INTEREST: Record<string, Interest> = (() => {
  const map: Record<string, Interest> = {};

  for (const interest of INTERESTS) {
    map[interest] = interest;
  }

  for (const interest of INTERESTS) {
    for (const keyword of INTEREST_KEYWORDS[interest]) {
      if (!(keyword in map)) {
        map[keyword] = interest;
      }
    }
  }

  return map;
})();
