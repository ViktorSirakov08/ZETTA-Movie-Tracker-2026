export const INTEREST_NAMES = [
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

export type InterestName = (typeof INTEREST_NAMES)[number];

/**
 * Related keywords each interest should match against when recommending
 * content (e.g. a movie tagged "heist" should count toward "crime").
 */
export const INTEREST_KEYWORDS: Record<InterestName, string[]> = {
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
