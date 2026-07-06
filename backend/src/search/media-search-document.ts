import { Media } from '../media/entity/media.entity';

export interface MediaSearchDocument {
  id: string;
  type: string;
  name: string;
  description: string;
  genres: string[];
  interests: string[];
  releaseDate: string;
  rating: number | null;
  ageRestriction: string;
}

export function toMediaSearchDocument(media: Media): MediaSearchDocument {
  return {
    id: media.id,
    type: media.type,
    name: media.name,
    description: media.description,
    genres: media.genres.map((genre) => genre.name),
    interests: media.interests.map((interest) => interest.name),
    releaseDate:
      media.releaseDate instanceof Date
        ? media.releaseDate.toISOString().slice(0, 10)
        : media.releaseDate,
    rating: media.rating,
    ageRestriction: media.ageRestriction,
  };
}
