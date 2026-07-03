import { ALL_INTEREST_KEYWORDS } from '../constants/interests';
import './InterestPicker.css';

interface InterestPickerProps {
  selectedKeywords: Set<string>;
  onToggle: (keyword: string) => void;
}

export function InterestPicker({
  selectedKeywords,
  onToggle,
}: InterestPickerProps) {
  return (
    <div className="interest-picker">
      {ALL_INTEREST_KEYWORDS.map((keyword) => {
        const isSelected = selectedKeywords.has(keyword);
        return (
          <button
            key={keyword}
            type="button"
            className={`interest-chip${isSelected ? ' interest-chip--selected' : ''}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(keyword)}
          >
            {keyword}
          </button>
        );
      })}
    </div>
  );
}
