export interface Genre {
  id: string;
  name: string;
}

export interface MediaInterest {
  id: string;
  name: string;
}

export interface Media {
  id: string;
  type: 'MOVIE' | 'SERIES';
  name: string;
  releaseDate: string;
  rating: number | null;
  description: string;
  genres: Genre[];
  interests: MediaInterest[];
  ageRestricted: boolean;
  ageRestricted13: boolean;
  durationMinutes: number | null;
  posterUrl: string | null;
  episodes?: Episode[] | null;
}

export interface Episode {
  id: string;
  mediaId: string;
  seasonNum: number;
  episodeNum: number;
  title: string;
}