export enum Genre {
  ACTION = 'action',
  ADVENTURE = 'adventure',
  ANIMATION = 'animation',
  COMEDY = 'comedy',
  CRIME = 'crime',
  DOCUMENTARY = 'documentary',
  DRAMA = 'drama',
  FAMILY = 'family',
  FANTASY = 'fantasy',
  HISTORY = 'history',
  HORROR = 'horror',
  MUSIC = 'music',
  MYSTERY = 'mystery',
  ROMANCE = 'romance',
  SCI_FI = 'sci-fi',
  THRILLER = 'thriller',
  WAR = 'war',
  WESTERN = 'western',
}

/**
 * Related keywords each genre should match against when recommending
 * content (e.g. a movie tagged "heist" should count toward Genre.CRIME).
 */
export const GENRE_KEYWORDS: Record<Genre, string[]> = {
  [Genre.ACTION]: ['action', 'fight', 'explosion', 'stunt', 'martial arts'],
  [Genre.ADVENTURE]: ['adventure', 'quest', 'expedition', 'journey','survival'],
  [Genre.ANIMATION]: ['animation', 'cartoon', 'anime'],
  [Genre.COMEDY]: ['comedy', 'sitcom', 'parody'],
  [Genre.CRIME]: ['crime', 'mystery', 'murder', 'detectives'],
  [Genre.DOCUMENTARY]: ['documentary', 'true story', 'biopic', 'docuseries'],
  [Genre.DRAMA]: ['drama', 'melodrama', 'coming of age', 'tragedy'],
  [Genre.FAMILY]: ['family', 'kids'],
  [Genre.FANTASY]: ['fantasy', 'magic', 'sword and sorcery', 'mythical'],
  [Genre.HISTORY]: ['history', 'period piece', 'war epic'],
  [Genre.HORROR]: ['horror', 'slasher', 'supernatural', 'zombie', 'monster'],
  [Genre.MUSIC]: ['music', 'musical', 'concert', 'band'],
  [Genre.MYSTERY]: ['mystery', 'whodunit', 'detective', 'crime', 'conspiracy'],
  [Genre.ROMANCE]: ['romance', 'love story', 'romantic comedy'],
  [Genre.SCI_FI]: ['sci-fi', 'space', 'alien', 'dystopia'],
  [Genre.THRILLER]: ['thriller', 'suspense', 'psychological', 'heist'],
  [Genre.WAR]: ['war', 'military', 'battle', 'war epic'],
  [Genre.WESTERN]: ['western', 'cowboy', 'outlaw', 'frontier'],
};
