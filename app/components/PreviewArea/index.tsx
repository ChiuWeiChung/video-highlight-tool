import React, { useState } from 'react';
import type { AIProcessResult, TranscriptSentence } from '../../types';

interface PreviewAreaProps {
  aiResult: AIProcessResult | null;
  uploadedVideo: File | null;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  className?: string;
}

export default function PreviewArea({
  aiResult,
  uploadedVideo,
  currentTime,
  onTimeUpdate,
  onPlay,
  onPause,
  isPlaying,
  className = ""
}: PreviewAreaProps) {
  
  const [showControls, setShowControls] = useState(true);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSelectedSentences = (): TranscriptSentence[] => {
    if (!aiResult) return [];
    return aiResult.sections
      .flatMap(section => section.sentences)
      .filter(sentence => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  };

  const getCurrentSubtitle = (): string => {
    if (!aiResult) return '';
    const selectedSentences = getSelectedSentences();
    const currentSentence = selectedSentences.find(
      sentence => currentTime >= sentence.startTime && currentTime <= sentence.endTime
    );
    return currentSentence?.text || '';
  };

  const getHighlightSegments = () => {
    const selectedSentences = getSelectedSentences();
    const totalDuration = aiResult?.totalDuration || 100;
    
    return selectedSentences.map(sentence => ({
      left: (sentence.startTime / totalDuration) * 100,
      width: ((sentence.endTime - sentence.startTime) / totalDuration) * 100,
      sentence
    }));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * (aiResult?.totalDuration || 100);
    onTimeUpdate(newTime);
  };

  if (!aiResult || !uploadedVideo) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-900 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="w-20 h-20 mx-auto mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53L15.75 17.5H9.75a.75.75 0 01-.75-.75v-5.5a.75.75 0 01.75-.75h6z M18.25 24.5v5.25c0 .414.336.75.75.75h12a.75.75 0 00.75-.75V24.5a.75.75 0 00-.75-.75H19a.75.75 0 00-.75.75z" />
            </svg>
          </div>
          <p className="text-lg font-medium">預覽區域</p>
          <p className="text-sm mt-1">上傳影片並處理完成後將顯示預覽</p>
        </div>
      </div>
    );
  }

  const selectedSentences = getSelectedSentences();
  const currentSubtitle = getCurrentSubtitle();

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">預覽區域</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>已選片段: {selectedSentences.length}</span>
            <span>
              預計時長: {formatTime(
                selectedSentences.reduce((acc, s) => acc + (s.endTime - s.startTime), 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 影片播放區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {/* 影片預覽佔位符 */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="text-center text-gray-400">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium">影片播放器</p>
            <p className="text-sm mt-1">{uploadedVideo.name}</p>
            <p className="text-xs text-gray-500 mt-2">
              * 此為示範版本，實際項目中會整合真實的影片播放器
            </p>
          </div>

          {/* 字幕覆蓋層 */}
          {currentSubtitle && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 max-w-4xl px-4">
              <div className="bg-black bg-opacity-75 rounded-lg px-6 py-3">
                <p className="text-white text-center text-lg leading-relaxed">
                  {currentSubtitle}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 時間軸和控制區域 */}
      <div className="flex-shrink-0 bg-gray-800 p-4 space-y-4">
        {/* 高亮時間軸 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>高亮片段時間軸</span>
            <span>{formatTime(currentTime)} / {formatTime(aiResult.totalDuration)}</span>
          </div>
          
          <div 
            className="relative h-8 bg-gray-700 rounded-lg cursor-pointer"
            onClick={handleProgressClick}
          >
            {/* 背景軌道 */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {/* 高亮片段 */}
              {getHighlightSegments().map((segment, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full bg-blue-500 opacity-60"
                  style={{
                    left: `${segment.left}%`,
                    width: `${segment.width}%`
                  }}
                  title={segment.sentence.text}
                />
              ))}
            </div>

            {/* 當前時間指示器 */}
            <div
              className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full transform -translate-x-1/2"
              style={{
                left: `${(currentTime / aiResult.totalDuration) * 100}%`
              }}
            />
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 10))}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={() => onTimeUpdate(Math.min(aiResult.totalDuration, currentTime + 10))}
            className="p-2 text-gray-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* 片段信息 */}
        {selectedSentences.length > 0 && (
          <div className="text-center text-sm text-gray-300">
            <p>
              已選擇 {selectedSentences.length} 個片段，
              總時長約 {formatTime(selectedSentences.reduce((acc, s) => acc + (s.endTime - s.startTime), 0))}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
