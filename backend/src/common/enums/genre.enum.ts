export enum GenreKeywords {
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
export const GENRE_KEYWORDS: Record<GenreKeywords, string[]> = {
  [GenreKeywords.ACTION]: ['action', 'fight', 'explosion', 'stunt', 'martial arts'],
  [GenreKeywords.ADVENTURE]: ['adventure', 'quest', 'expedition', 'journey','survival'],
  [GenreKeywords.ANIMATION]: ['animation', 'cartoon', 'anime'],
  [GenreKeywords.COMEDY]: ['comedy', 'sitcom', 'parody'],
  [GenreKeywords.CRIME]: ['crime', 'mystery', 'murder', 'detectives'],
  [GenreKeywords.DOCUMENTARY]: ['documentary', 'true story', 'biopic', 'docuseries'],
  [GenreKeywords.DRAMA]: ['drama', 'melodrama', 'coming of age', 'tragedy'],
  [GenreKeywords.FAMILY]: ['family', 'kids'],
  [GenreKeywords.FANTASY]: ['fantasy', 'magic', 'sword and sorcery', 'mythical'],
  [GenreKeywords.HISTORY]: ['history', 'period piece', 'war epic'],
  [GenreKeywords.HORROR]: ['horror', 'slasher', 'supernatural', 'zombie', 'monster'],
  [GenreKeywords.MUSIC]: ['music', 'musical', 'concert', 'band'],
  [GenreKeywords.MYSTERY]: ['mystery', 'whodunit', 'detective', 'crime', 'conspiracy'],
  [GenreKeywords.ROMANCE]: ['romance', 'love story', 'romantic comedy'],
  [GenreKeywords.SCI_FI]: ['sci-fi', 'space', 'alien', 'dystopia'],
  [GenreKeywords.THRILLER]: ['thriller', 'suspense', 'psychological', 'heist'],
  [GenreKeywords.WAR]: ['war', 'military', 'battle', 'war epic'],
  [GenreKeywords.WESTERN]: ['western', 'cowboy', 'outlaw', 'frontier'],
};
