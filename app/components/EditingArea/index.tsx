import type { AIProcessResult, TranscriptSentence } from '../../types';
import { formatTime } from '../../lib/utils';
import { CheckIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface EditingAreaProps {
  highlightClips: AIProcessResult;
  onSentenceSelect: (sentenceId: string, isSelected: boolean) => void;
  onTimestampClick: (time: number) => void;
  currentTime?: number;
  className?: string;
  getHighlightSentenceByTime: (time: number) => TranscriptSentence | undefined;
}

export default function EditingArea({ 
  highlightClips, 
  onSentenceSelect, 
  onTimestampClick, 
  currentTime = 0,
  getHighlightSentenceByTime,
  className
}: EditingAreaProps) {
  const sentenceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastScrolledIdRef = useRef<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true); // 是否跟隨播放進度自動捲動;

  const handleSentenceToggle = (sentence: TranscriptSentence) => {
    onSentenceSelect(sentence.id, !sentence.isSelected);
  };
  
  const currentSentence = useMemo(() => {
    return getHighlightSentenceByTime(currentTime);
  }, [currentTime]);
  
  const isCurrentSentence = (sentence: TranscriptSentence): boolean => {
    if(!currentSentence) return false;
    return currentSentence.id === sentence.id;
  };

  // 自動捲動到當前字幕
  useEffect(() => {
    if (!autoFollow || !currentSentence?.id) return;
    if (lastScrolledIdRef.current === currentSentence.id) return;
    const el = sentenceRefs.current[currentSentence.id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    lastScrolledIdRef.current = currentSentence.id;
  }, [autoFollow, currentSentence?.id]);

  return (
    <div className="h-[15rem] md:h-full flex flex-col border rounded-lg overflow-hidden border-gray-200">
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 text-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold ">編輯區域</h2>
          <div className="flex items-center space-x-4 ">
            <label className="inline-flex items-center space-x-2 select-none">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300  focus:ring-blue-500" checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} />
              <span>跟隨播放</span>
            </label>
            <span>
              {highlightClips.sections.reduce((acc, section) => acc + section.sentences.filter((s) => s.isSelected).length, 0)} /{' '}
              {highlightClips.sections.reduce((acc, section) => acc + section.sentences.length, 0)} 句已選
            </span>
          </div>
        </div>
      </div>

      {/* 轉錄文本內容 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 max-h-unset md:max-h-[70vh]">
        <div className="lg:p-4 space-y-6">
          {highlightClips.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* 章節標題 */}
              <h3 className="bg-gray-50 p-2 border-b border-gray-200 text-md font-medium text-gray-900 ">
                {section.title}
              </h3>

              {/* 字幕列表 */}
              <div className="p-2 lg:p-4 space-y-3">
                {section.sentences.map((sentence) => (
                  <div
                    key={sentence.id}
                    className={`
                      group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${sentence.isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'}
                      ${isCurrentSentence(sentence) ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''}
                    `}
                    ref={(el) => {
                      if (el) sentenceRefs.current[sentence.id] = el;
                    }}
                    onClick={() => handleSentenceToggle(sentence)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 選擇框 */}
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${sentence.isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 group-hover:border-gray-400'}
                        `}
                        >
                          {sentence.isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                        </div>
                      </div>

                      {/* 字幕內容 */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`
                          text-xs md:text-sm leading-relaxed
                          ${sentence.isSelected ? 'text-blue-900' : 'text-gray-700'}
                          ${isCurrentSentence(sentence) ? 'font-medium' : ''}
                        `}
                        >
                          {sentence.text}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTimestampClick(sentence.startTime);
                            }}
                            className={`
                              text-xs px-2 py-1 rounded transition-colors cursor-pointer
                              ${sentence.isSelected ? 'text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200' : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'}
                            `}
                          >
                            {formatTime(sentence.startTime)} - {formatTime(sentence.endTime)}
                          </button>

                          {/* Highlight建議標誌 */}
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
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
