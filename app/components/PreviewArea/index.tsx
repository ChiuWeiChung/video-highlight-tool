import { useState,  useEffect, forwardRef } from 'react';
import type {  TranscriptSentence } from '../../types';
import { ArrowBigLeftIcon, ArrowBigRightIcon, Loader2Icon, PauseIcon, PlayIcon } from 'lucide-react';
import { formatTime } from '../../lib/utils';
import ReactPlayer from 'react-player'; // 使用完整的 ReactPlayer

interface PreviewAreaProps {
  uploadedVideo: File;
  currentTime: number;
  // onTimeUpdate: (time: number) => void;
  setCurrentTime: (time: number) => void;
  selectedSentences?: TranscriptSentence[];

  getHighlightSentenceByTime: (time: number) => TranscriptSentence | undefined;
  getNextSentence: (time: number) => TranscriptSentence | undefined;
  getPreviousSentence: (time: number) => TranscriptSentence | undefined;
}

const PreviewArea = forwardRef<HTMLVideoElement, PreviewAreaProps>((props: PreviewAreaProps, playerRef) => {
  const { uploadedVideo, currentTime, setCurrentTime, selectedSentences = [], getHighlightSentenceByTime, getNextSentence, getPreviousSentence } = props;
  const [duration, setDuration] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSubtitle = getHighlightSentenceByTime(currentTime)?.text;
  const hasSelectedSentences = selectedSentences.length > 0;

  // 建立影片 Object URL
  useEffect(() => {
    const url = URL.createObjectURL(uploadedVideo);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedVideo]);

  // 進行播放
  const onPlay = () => {
    setIsPlaying(true);
  };

  // 暫停播放
  const onPause = () => {
    setIsPlaying(false);
  };

  // 影片開始播放時 (只有影片第一次開始播放時觸發)
  const handleStart = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    const currentTime = target.currentTime;

    // 如果當前時間不在任何 被選取字幕列表 範圍內，跳轉到第一個選中字幕
    const currentSentence = getHighlightSentenceByTime(currentTime);
    if (!currentSentence) {
      const { startTime } = selectedSentences[0];
      target.currentTime = startTime;
    }
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    setDuration(target.duration);
  };

  // 當 video 播放時間變化時呼叫
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    // 如果 EditingArea 中的被選取字幕列表為空，不應該進入此邏輯
    if (!hasSelectedSentences) return;
    const playingSentence = getHighlightSentenceByTime(target.currentTime);
    // 檢查是否還在 被選取字幕列表 範圍內    
    if (!playingSentence) {
      // 不在選中字幕範圍內，查找下一個字幕
      const nextSentence = getNextSentence(target.currentTime);
      if (nextSentence) {
        target.currentTime = nextSentence.startTime;
        setCurrentTime(nextSentence.startTime);
      } else onPause();
    } else setCurrentTime(target.currentTime);
  };

  const renderHighlightSegments = () => {
    return selectedSentences.map((sentence, index) => (
      <div
        key={index}
        className="absolute top-0 h-full bg-blue-500 opacity-60"
        style={{
          left: `${(sentence.startTime / duration) * 100}%`,
          width: `${((sentence.endTime - sentence.startTime) / duration) * 100}%`,
        }}
        title={sentence.text}
      />
    ));
  };

  // 根據點擊進度條的位置計算對應的時間，並將播放器跳轉到該時間點
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;

    const player = playerRef as React.RefObject<HTMLVideoElement>;
    if (player.current) player.current.currentTime = newTime;
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">預覽區域</h2>
          <div className="flex items-center space-x-4 text-sm text-gray-300">
            <span>已選片段: {selectedSentences.length}</span>
            <span>總時長: {formatTime(selectedSentences.reduce((acc, s) => acc + (s.endTime - s.startTime), 0))}</span>
          </div>
        </div>
      </div>

      {/* 影片播放區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center ">
        {videoUrl ? (
          <div className="relative w-full h-full">
            <ReactPlayer
              ref={playerRef}
              src={videoUrl}
              playing={isPlaying}
              controls={false}
              width="100%"
              height="100%"
              onStart={handleStart}
              onPlay={onPlay}
              onPause={onPause}
              onEnded={onPause}
              onTimeUpdate={handleTimeUpdate}
              onCanPlay={handleCanPlay}
            />

            {/* 字幕覆蓋層 */}
            {currentSubtitle && (
              <div className="absolute opacity-60 bottom-0 bg-black rounded-lg w-full left-1/2 -translate-x-1/2 p-4 z-10">
                <p className="text-white text-center text-xs sm:text-sm md:text-lg leading-relaxed font-medium">{currentSubtitle}</p>
              </div>
            )}
          </div>
        ) : (
          /* 載入中狀態 */
          <div className="text-center text-gray-400 flex flex-col items-center gap-4">
            <Loader2Icon className="w-12 h-12 animate-spin" />
            <p className="text-lg font-medium">正在載入影片...</p>
            <p className="w-1/2">{uploadedVideo?.name}</p>
          </div>
        )}
      </div>

      {/* 時間軸和控制區域 */}
      <div className="flex-shrink-0 bg-gray-800 p-4 space-y-4">
        {/* Highlight 時間軸 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Highlight 時間軸</span>
            <span>
              {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
            </span>
          </div>

          {/* 背景軌道 */}
          <div className="relative h-8 bg-gray-700 rounded-lg cursor-pointer" onClick={handleProgressClick}>
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {/* Highlight 片段 */}
              {renderHighlightSegments()}
            </div>

            {/* 當前時間指示器 */}
            <div
              className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full transform -translate-x-1/2"
              style={{
                left: `${(currentTime / duration) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              if (selectedSentences.length > 0) {
                const prevSentence = getPreviousSentence(currentTime);
                const videoEl = (playerRef as React.RefObject<HTMLVideoElement>).current;
                if (prevSentence && videoEl) videoEl.currentTime = prevSentence.startTime;
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            disabled={!hasSelectedSentences}
            title="上一個片段"
          >
            <ArrowBigLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`p-3 rounded-full transition-colors ${!hasSelectedSentences ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            disabled={!hasSelectedSentences}
            title={hasSelectedSentences ? '請先選擇 Highlight 片段' : isPlaying ? '暫停' : '播放'}
          >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => {
              if (hasSelectedSentences && (playerRef as React.RefObject<HTMLVideoElement>).current) {
                const nextSentence = getNextSentence(currentTime);
                const videoEl = (playerRef as React.RefObject<HTMLVideoElement>).current;
                if (nextSentence && videoEl) videoEl.currentTime = nextSentence.startTime;
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            disabled={!hasSelectedSentences}
            title="下一個片段"
          >
            <ArrowBigRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
});

export default PreviewArea;