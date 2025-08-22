import type { AIProcessResult, TranscriptSentence } from '../../types';
import { useEffect, useMemo, useRef, useState } from 'react';
import SectionCard from './SectionCard';

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
}: EditingAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    if (!currentSentence) return false;
    return currentSentence.id === sentence.id;
  };

  const { selectedCount, totalCount } = useMemo(() => {
    let selected = 0;
    let total = 0;

    for (const sec of highlightClips.sections) {
      total += sec.sentences.length;
      for (const s of sec.sentences) {
        if (s.isSelected) selected++;
      }
    }
    return { selectedCount: selected, totalCount: total };
  }, [highlightClips]);

  // 自動捲動到當前字幕
  useEffect(() => {
    if (!autoFollow || !currentSentence?.id) return;
    if (lastScrolledIdRef.current === currentSentence.id) return;

    const el = sentenceRefs.current[currentSentence.id];
    const container = containerRef.current;
    if (!el || !container) return;

    // 容器與元素的可視區域座標
    const cRectTop = container.getBoundingClientRect().top;
    const eRectTop = el.getBoundingClientRect().top;

    // 關鍵：將 viewport 相對座標換算成容器的捲動目標
    const offsetFromContainerTop = eRectTop - cRectTop; // 元素頂到容器頂的距離（以目前畫面為基準）
    // 讓元素置中
    const target = container.scrollTop + offsetFromContainerTop - (container.clientHeight - el.clientHeight) / 2;
    container.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    lastScrolledIdRef.current = currentSentence.id;
  }, [autoFollow, currentSentence?.id]);

  return (
    <div className="h-[20rem] md:h-full flex flex-col border rounded-lg overflow-hidden border-gray-200">
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 text-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold ">編輯區域</h2>
          <div className="flex items-center space-x-4 ">
            <label className="inline-flex items-center space-x-2 select-none">
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300  focus:ring-blue-500" checked={autoFollow} onChange={(e) => setAutoFollow(e.target.checked)} />
              <span>跟隨播放</span>
            </label>

            <span >
              已選擇 {selectedCount} 句（共 {totalCount} 句）
            </span>
            {/* <span>
              已選擇 {highlightClips.sections.reduce((acc, section) => acc + section.sentences.filter((s) => s.isSelected).length, 0)} 句 共{' '}
              {highlightClips.sections.reduce((acc, section) => acc + section.sentences.length, 0)}
            </span> */}
          </div>
        </div>
      </div>

      {/* 轉錄文本內容 */}
      <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50 max-h-unset md:max-h-[70vh]">
        <div className="lg:p-4 space-y-6">
          {highlightClips.sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              sentenceRefs={sentenceRefs}
              isCurrentSentence={isCurrentSentence}
              handleSentenceToggle={handleSentenceToggle}
              onTimestampClick={onTimestampClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
