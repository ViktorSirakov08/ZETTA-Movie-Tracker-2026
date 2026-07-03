import { INTERESTS } from '../constants/interests';
import './InterestPicker.css';

interface InterestPickerProps {
  selectedKeywords: Set<string>;
  onToggle: (keyword: string) => void;
  keywords?: readonly string[];
  labels?: Record<string, string>;
}

export function InterestPicker({
  selectedKeywords,
  onToggle,
  keywords = INTERESTS,
  labels,
}: InterestPickerProps) {
  return (
    <div className="interest-picker">
      {keywords.map((keyword) => {
        const isSelected = selectedKeywords.has(keyword);
        return (
          <button
            key={keyword}
            type="button"
            className={`interest-chip${isSelected ? ' interest-chip--selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(keyword)}
          >
            {labels?.[keyword] ?? keyword}
          </button>
        );
      })}
    </div>
  );
}
