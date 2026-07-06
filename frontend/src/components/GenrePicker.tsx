import type { Genre } from '../types/genre';
import './InterestPicker.css';

interface GenrePickerProps {
  genres: Genre[];
  selectedIds: Set<string>;
  onToggle: (genreId: string) => void;
}

function formatGenreName(name: string): string {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');
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
            {formatGenreName(genre.name)}
          </button>
        );
      })}
    </div>
  );
}
