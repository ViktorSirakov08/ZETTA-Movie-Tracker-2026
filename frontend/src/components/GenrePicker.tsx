import type { Genre } from '../types/genre';
import { formatGenreLabel } from '../constants/interests';
import './InterestPicker.css';

interface GenrePickerProps {
  genres: Genre[];
  selectedIds: Set<string>;
  onToggle: (genreId: string) => void;
}

export function GenrePicker({
  genres,
  selectedIds,
  onToggle,
}: GenrePickerProps) {
  return (
    <div className="interest-picker">
      {genres.map((genre) => {
        const isSelected = selectedIds.has(genre.id);
        return (
          <button
            key={genre.id}
            type="button"
            className={`interest-chip${isSelected ? ' interest-chip--selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(genre.id)}
          >
            {formatGenreLabel(genre.name)}
          </button>
        );
      })}
    </div>
  );
}
