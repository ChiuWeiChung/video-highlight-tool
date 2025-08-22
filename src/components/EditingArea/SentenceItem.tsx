// 🧩 SentenceItem.tsx
import { forwardRef } from 'react';
import { CheckIcon } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface SentenceItemProps {
  sentence: {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    isSelected: boolean;
    isHighlight?: boolean;
  };
  isCurrent: boolean;
  onToggle: () => void;
  onTimestampClick: (time: number) => void;
}

const SentenceItem = forwardRef<HTMLDivElement, SentenceItemProps>(({ sentence, isCurrent, onToggle, onTimestampClick }, ref) => {
  const isSelected = sentence.isSelected;

  return (
    <div
      ref={ref}
      onClick={onToggle}
      className={`group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}
          ${isCurrent ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
              ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'}`}
          >
            {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className={`text-xs md:text-sm leading-relaxed ${isSelected ? 'text-blue-900' : 'text-gray-700'} ${isCurrent ? 'font-medium' : ''}`}>{sentence.text}</p>

          <div className="flex items-center justify-between mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTimestampClick(sentence.startTime);
              }}
              disabled={!isSelected}
              className={`text-xs px-2 py-1 rounded transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50
                  ${isSelected ? 'text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200' : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'}`}
            >
              {formatTime(sentence.startTime)} - {formatTime(sentence.endTime)}
            </button>

            {sentence.isHighlight && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span className="text-xs text-yellow-700">AI 推薦</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default SentenceItem;
