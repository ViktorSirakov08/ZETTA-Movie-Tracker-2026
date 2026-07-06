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

/**
 * Mirrors backend/src/common/constants/interest-names.ts INTEREST_NAMES.
 * Keep in sync manually since frontend/backend are separate packages.
 */
export const INTEREST_NAMES = [
  'action',
  'adventure',
  'alien',
  'animation',
  'anime',
  'band',
  'battle',
  'biopic',
  'cartoon',
  'comedy',
  'conspiracy',
  'cowboy',
  'crime',
  'detective',
  'detectives',
  'documentary',
  'docuseries',
  'drama',
  'dystopia',
  'expedition',
  'explosion',
  'family',
  'fantasy',
  'fight',
  'frontier',
  'heist',
  'history',
  'horror',
  'journey',
  'kids',
  'love story',
  'magic',
  'martial arts',
  'melodrama',
  'military',
  'monster',
  'murder',
  'music',
  'mystery',
  'mythical',
  'outlaw',
  'parody',
  'period piece',
  'psychological',
  'quest',
  'romance',
  'romantic comedy',
  'sci-fi',
  'sitcom',
  'slasher',
  'space',
  'stunt',
  'supernatural',
  'survival',
  'suspense',
  'sword and sorcery',
  'thriller',
  'tragedy',
  'war',
  'war epic',
  'western',
  'whodunit',
  'zombie',
] as const;

export type InterestName = (typeof INTEREST_NAMES)[number];

/** @deprecated Use INTEREST_NAMES */
export const INTERESTS = INTEREST_NAMES;

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
  INTEREST_NAMES.map((interest) => [interest, toTitleCase(interest)]),
);

export const GENRE_LABELS: Record<GenreName, string> = Object.fromEntries(
  GENRE_NAMES.map((genre) => [genre, toTitleCase(genre)]),
) as Record<GenreName, string>;
