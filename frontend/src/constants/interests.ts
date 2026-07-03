/**
 * Broad content categories, used later to group/recommend media by genre.
 * Not something a user directly picks or that gets stored on their profile.
 */
export const GENRE_NAMES = [
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

export type GenreName = (typeof GENRE_NAMES)[number];

/**
 * Mirrors backend/src/common/constants/interest-names.ts GENRE_KEYWORDS.
 * Keep in sync manually since frontend/backend are separate packages.
 */
export const GENRE_KEYWORDS: Record<GenreName, string[]> = {
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
  music: ['music', 'band'],
  mystery: ['mystery', 'whodunit', 'detective', 'crime', 'conspiracy'],
  romance: ['romance', 'love story', 'romantic comedy'],
  'sci-fi': ['sci-fi', 'space', 'alien', 'dystopia'],
  thriller: ['thriller', 'suspense', 'psychological', 'heist'],
  war: ['war', 'military', 'battle', 'war epic'],
  western: ['western', 'cowboy', 'outlaw', 'frontier'],
};

/** The specific tags a user can actually pick as their interests. */
export const INTERESTS = Array.from(
  new Set(Object.values(GENRE_KEYWORDS).flat()),
).sort((a, b) => a.localeCompare(b));

export type Interest = string;

function toTitleCase(value: string): string {
  return value
    .split(' ')
    .map((word) =>
      word
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('-'),
    )
    .join(' ');
}

export const INTEREST_LABELS: Record<string, string> = Object.fromEntries(
  INTERESTS.map((interest) => [interest, toTitleCase(interest)]),
);
