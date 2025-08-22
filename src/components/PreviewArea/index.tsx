import { useState, useEffect, type RefObject, useMemo, useCallback } from 'react';
import type { AIProcessResult, TranscriptSentence } from '@/types';
import { ArrowBigLeftIcon, ArrowBigRightIcon, Loader2Icon, PauseIcon, PlayIcon } from 'lucide-react';
import { formatTime } from '@/lib/utils';

interface PreviewAreaProps {
  highlightClips: AIProcessResult;
  uploadedVideo: File;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  selectedSentences: TranscriptSentence[];
  getHighlightSentenceByTime: (time: number) => TranscriptSentence | undefined;
  playerRef: RefObject<HTMLVideoElement | null>;
}

export default function PreviewArea({ playerRef, uploadedVideo, currentTime, setCurrentTime, selectedSentences = [], getHighlightSentenceByTime, highlightClips }: PreviewAreaProps) {
  const [duration, setDuration] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const currentSubtitle = getHighlightSentenceByTime(currentTime)?.text;
  const hasSelectedSentences = selectedSentences.length > 0;

  // 內部實現 isInSelectedSentences 邏輯
  const isInSelectedSentences = (time: number) => {
    // 透過 flatMap 得到所有句子清單（包含選取以及未選取的）

    // 找到當前時間對應的句子
    for (let i = 0; i < allSentences.length; i++) {
      const currentSentence = allSentences[i];
      const nextSentence = allSentences[i + 1];
      // 計算當前句子的結束時間
      const endTime = nextSentence ? nextSentence.startTime : duration;

      // 檢查時間是否在當前句子的範圍內
      // 對於最後一個句子，使用 <= 來包含結束時間點
      const isInRange = nextSentence ? time >= currentSentence.startTime && time < endTime : time >= currentSentence.startTime && time <= endTime;
      if (isInRange) return currentSentence.isSelected;
    }

    return false;
  };

  // 查找下一個要播放的字幕
  const getNextSentence = (time: number) => {
    return selectedSentences.find((sentence) => sentence.startTime > time);
  };

  // 查找前一個要播放的字幕
  const getPreviousSentence = (time: number) => {
    // 找到當前正在播放的句子
    const currentSentence = getHighlightSentenceByTime(time);
    if (currentSentence) {
      const currentIndex = selectedSentences.indexOf(currentSentence);
      return currentIndex > 0 ? selectedSentences[currentIndex - 1] : selectedSentences[0];
    }
    return selectedSentences[0];
  };

  // 播放
  const onPlay = () => {
    setIsPlaying(true);
  };

  // 暫停播放
  const onPause = () => {
    setIsPlaying(false);
  };

  // 進行播放
  const handlePlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    const currentTime = target.currentTime;
    // 如果當前時間不在任何 被選取字幕列表 範圍內，跳轉到第一個選中字幕
    const currentSentence = getHighlightSentenceByTime(currentTime);
    if (!currentSentence) {
      const { startTime } = selectedSentences[0];
      target.currentTime = startTime;
    }
    onPlay();
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    setDuration(target.duration);
  };

  // 當 video 播放時間變化時呼叫
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;
    const inSelectedSentences = isInSelectedSentences(target.currentTime);
    // 檢查是否還在 被選取字幕列表 範圍內
    if (!inSelectedSentences) {
      // 不在選中字幕範圍內，查找下一個字幕
      const nextSentence = getNextSentence(target.currentTime);
      if (nextSentence) {
        target.currentTime = nextSentence.startTime;
        setCurrentTime(nextSentence.startTime);
      } else {
        // 進入此邏輯代表已經播放到最後一個字幕，將播放器時間重置到 0
        target.currentTime = 0;
        onPause();
      }
    } else setCurrentTime(target.currentTime);
  };

  const allSentences = useMemo(() => {
    return highlightClips.sections.flatMap((section) => section.sentences);
  }, [highlightClips]);

  const highlightSegments = useMemo(() => {
    return selectedSentences.map((sentence, index) => {
      let sentenceDuration = 0;

      // 找到當前句子在完整列表中的位置
      const currentSentenceIndex = allSentences.findIndex((s) => s.id === sentence.id);

      if (currentSentenceIndex >= 0) {
        // 找到下一個句子（不論是否被選取）
        const nextSentence = allSentences[currentSentenceIndex + 1];
        if (nextSentence) {
          sentenceDuration = nextSentence.startTime - sentence.startTime;
        } else {
          // 如果是最後一個句子，使用影片總時長
          sentenceDuration = duration - sentence.startTime;
        }
      } else {
        // 後備方案：使用下一個已選句子或預設值
        const nextSelectedSentence = selectedSentences[index + 1];
        sentenceDuration = nextSelectedSentence ? nextSelectedSentence.startTime - sentence.startTime : duration - sentence.startTime;
      }

      return (
        <div
          key={index}
          className="absolute top-0 h-full bg-blue-500 opacity-60"
          style={{
            left: `${(sentence.startTime / duration) * 100}%`,
            width: `${(sentenceDuration / duration) * 100}%`,
          }}
          title={sentence.text}
        />
      );
    });
  }, [allSentences, duration, selectedSentences]);

  // 根據點擊進度條的位置計算對應的時間，並將播放器跳轉到該時間點
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    if (playerRef.current) playerRef.current.currentTime = newTime;
  };

  // 建立影片 Object URL
  useEffect(() => {
    const url = URL.createObjectURL(uploadedVideo);
    setVideoUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [uploadedVideo]);

  // 控制播放器播放/暫停
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;
    if (isPlaying) player.play();
    else player.pause();
  }, [isPlaying]);

  return (
    <div className="h-full flex flex-col bg-gray-900 rounded-lg overflow-hidden">
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">預覽區域</h2>
        </div>
      </div>

      {/* 影片播放區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center ">
        {videoUrl ? (
          <div className="relative w-full h-full">
            <video
              ref={playerRef}
              src={videoUrl}
              controls={false}
              width="100%"
              height="100%"
              onPlay={handlePlay}
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
              {highlightSegments}
            </div>

            {/* Time Indicator */}
            <div className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full transform -translate-x-1/2" style={{ left: `${(currentTime / duration) * 100}%` }} />
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              if (selectedSentences.length > 0 && playerRef.current) {
                const prevSentence = getPreviousSentence(currentTime);
                if (prevSentence) playerRef.current.currentTime = prevSentence.startTime;
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            disabled={!hasSelectedSentences}
            title="上一個片段"
          >
            <ArrowBigLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`p-3 rounded-full transition-colors cursor-pointer ${!hasSelectedSentences ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            disabled={!hasSelectedSentences}
            title={hasSelectedSentences ? '請先選擇 Highlight 片段' : isPlaying ? '暫停' : '播放'}
          >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => {
              if (hasSelectedSentences && playerRef.current) {
                const nextSentence = getNextSentence(currentTime);
                if (nextSentence) playerRef.current.currentTime = nextSentence.startTime;
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
            disabled={!hasSelectedSentences}
            title="下一個片段"
          >
            <ArrowBigRightIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
