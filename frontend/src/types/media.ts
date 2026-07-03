export interface Genre {
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
  ageRestricted: boolean;
  durationMinutes: number | null;
  posterUrl: string | null;
}