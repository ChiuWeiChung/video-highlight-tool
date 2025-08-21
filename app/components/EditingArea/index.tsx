import React from 'react';
import type { AIProcessResult, TranscriptSentence } from '../../types';

interface EditingAreaProps {
  aiResult: AIProcessResult | null;
  onSentenceSelect: (sentenceId: string, isSelected: boolean) => void;
  onTimestampClick: (time: number) => void;
  currentTime?: number;
  className?: string;
}

export default function EditingArea({ 
  aiResult, 
  onSentenceSelect, 
  onTimestampClick, 
  currentTime = 0,
  className = "" 
}: EditingAreaProps) {
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentSentence = (sentence: TranscriptSentence): boolean => {
    return currentTime >= sentence.startTime && currentTime <= sentence.endTime;
  };

  const handleSentenceToggle = (sentence: TranscriptSentence) => {
    onSentenceSelect(sentence.id, !sentence.isSelected);
  };

  if (!aiResult) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h30m-24 4h18m-12 4h6" />
            </svg>
          </div>
          <p className="text-lg font-medium">等待 AI 處理完成</p>
          <p className="text-sm mt-1">處理完成後將顯示轉錄文本</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">編輯區域</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>
              總時長: {formatTime(aiResult.totalDuration)}
            </span>
            <span>
              {aiResult.sections.reduce((acc, section) => 
                acc + section.sentences.filter(s => s.isSelected).length, 0
              )} / {aiResult.sections.reduce((acc, section) => acc + section.sentences.length, 0)} 句已選
            </span>
          </div>
        </div>
      </div>

      {/* 轉錄文本內容 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 space-y-6">
          {aiResult.sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* 章節標題 */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium text-gray-900">{section.title}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <button
                      onClick={() => onTimestampClick(section.startTime)}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {formatTime(section.startTime)} - {formatTime(section.endTime)}
                    </button>
                    <span className="text-xs">
                      ({section.sentences.length} 句)
                    </span>
                  </div>
                </div>
              </div>

              {/* 句子列表 */}
              <div className="p-4 space-y-3">
                {section.sentences.map((sentence) => (
                  <div
                    key={sentence.id}
                    className={`
                      group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                      ${sentence.isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                      ${isCurrentSentence(sentence) 
                        ? 'ring-2 ring-yellow-400 ring-opacity-50' 
                        : ''
                      }
                    `}
                    onClick={() => handleSentenceToggle(sentence)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 選擇框 */}
                      <div className="flex-shrink-0 mt-1">
                        <div className={`
                          w-5 h-5 rounded border-2 flex items-center justify-center transition-colors
                          ${sentence.isSelected 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-300 group-hover:border-gray-400'
                          }
                        `}>
                          {sentence.isSelected && (
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* 句子內容 */}
                      <div className="flex-1 min-w-0">
                        <p className={`
                          text-sm leading-relaxed
                          ${sentence.isSelected ? 'text-blue-900' : 'text-gray-700'}
                          ${isCurrentSentence(sentence) ? 'font-medium' : ''}
                        `}>
                          {sentence.text}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTimestampClick(sentence.startTime);
                            }}
                            className={`
                              text-xs px-2 py-1 rounded transition-colors
                              ${sentence.isSelected 
                                ? 'text-blue-700 hover:text-blue-800 bg-blue-100 hover:bg-blue-200' 
                                : 'text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200'
                              }
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

                    {/* 當前播放指示器 */}
                    {isCurrentSentence(sentence) && (
                      <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                        <div className="w-1 h-8 bg-yellow-400 rounded-full"></div>
                      </div>
                    )}
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
