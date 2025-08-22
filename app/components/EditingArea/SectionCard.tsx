
import type { RefObject } from 'react';
import SentenceItem from './SentenceItem';
import type { TranscriptSentence } from '~/types';


interface Section {
  id: string;
  title: string;
  sentences: TranscriptSentence[];
}

interface SectionCardProps {
  section: Section;
  sentenceRefs: RefObject<Record<string, HTMLDivElement | null>>;
  isCurrentSentence: (s: TranscriptSentence) => boolean;
  handleSentenceToggle: (s: TranscriptSentence) => void;
  onTimestampClick: (time: number) => void;
}

const SectionCard = ({ section, sentenceRefs, isCurrentSentence, handleSentenceToggle, onTimestampClick }: SectionCardProps) => {
  return (
    <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <h3 className="bg-gray-50 p-2 border-b border-gray-200 text-md font-medium text-gray-900">{section.title}</h3>
      <div className="p-2 lg:p-4 space-y-3">
        {section.sentences.map((sentence) => (
          <SentenceItem
            key={sentence.id}
            sentence={sentence}
            ref={(el) => {
              if (el) sentenceRefs.current[sentence.id] = el;
            }}
            isCurrent={isCurrentSentence(sentence)}
            onToggle={() => handleSentenceToggle(sentence)}
            onTimestampClick={onTimestampClick}
          />
        ))}
      </div>
    </section>
  );
};

export default SectionCard;
