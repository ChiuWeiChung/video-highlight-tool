import React, { useState, useRef, useEffect, type ReactEventHandler } from 'react';
import ReactPlayerWrapper from '../ReactPlayerWrapper';
import type { AIProcessResult, TranscriptSentence } from '../../types';
import { ArrowBigLeftIcon, ArrowBigRightIcon, Loader2Icon, PauseIcon, PlayIcon } from 'lucide-react';
import { formatTime } from '../../lib/utils';

interface PreviewAreaProps {
  aiResult: AIProcessResult;
  uploadedVideo: File ;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  selectedSentences?: TranscriptSentence[];
  className?: string;
  getCurrentPlayingSentence: (time: number) => TranscriptSentence | undefined;
  getNextSentence: (time: number) => TranscriptSentence | undefined;
}

export default function PreviewArea({
  aiResult,
  uploadedVideo,
  currentTime,
  onTimeUpdate,
  onPlay,
  onPause,
  isPlaying,
  selectedSentences = [],
  className = '',
  getCurrentPlayingSentence,
  getNextSentence,
}: PreviewAreaProps) {
  // video element
  const playerRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  // 創建影片 URL
  useEffect(() => {
    if (uploadedVideo) {
      const url = URL.createObjectURL(uploadedVideo);
      setVideoUrl(url);
      setPlayerReady(false); // 重置播放器狀態

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [uploadedVideo]);

  // 同步播放時間
  // useEffect(() => {
  //   const player = playerRef.current;
  //   if (player && playerReady) {
  //     // 檢查播放器是否已準備好且有必要的方法
  //     if (typeof player.seekTo === 'function' && typeof player.getCurrentTime === 'function') {
  //       try {
  //         const currentPlayerTime = player.getCurrentTime();
  //         if (Math.abs(currentPlayerTime - currentTime) > 0.5) {
  //           console.log(`同步播放時間: ${currentPlayerTime}s → ${currentTime}s`);
  //           player.seekTo(currentTime, 'seconds');
  //         }
  //       } catch (error) {
  //         console.error('播放器時間同步錯誤:', error);
  //       }
  //     }
  //   }
  // }, [currentTime, playerReady]);

  // Note: 只有影片第一次開始播放時觸發，之後不會再觸發
  const handleStart = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.log('onStart: 播放開始!!!');
    const target = e.target as HTMLVideoElement;
    const currentTime = target.currentTime;

    // 如果當前時間不在任何選中句子範圍內，跳轉到第一個選中句子
    const currentSentence = getCurrentPlayingSentence(currentTime);
    if (!currentSentence && playerRef.current) {
      const { startTime } = selectedSentences[0];
      playerRef.current.currentTime = startTime;
    }
  };

  const handleReady = () => {
    console.log('播放器已準備就緒');
    setPlayerReady(true);
  };

  const handleError = (error: unknown) => {
    console.error('播放器錯誤:', error);
  };

  const handleCanPlay = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.log('影片可以播放');
    const target = e.target as HTMLVideoElement;
    setDuration(target.duration);
  };

  // 當 video 播放時間變化時呼叫
  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const target = e.target as HTMLVideoElement;

    if (isPlaying) {
      // TODO 待優化，如果沒有 selectedSentences，不應該進入此邏輯
      if (selectedSentences.length === 0) {
        console.log('沒有選中的Highlight片段，無法播放');
        return;
      }

      // 檢查是否還在選中的句子範圍內
      const playingSentence = getCurrentPlayingSentence(target.currentTime);

      if (!playingSentence && playerRef.current) {
        // 不在選中句子範圍內，查找下一個句子
        const nextSentence = getNextSentence(target.currentTime);

        if (nextSentence) {
          // 跳轉到下一個句子的開始時間
          console.log(`跳轉到下一個Highlight片段: ${nextSentence.startTime}s`);
          playerRef.current.currentTime = nextSentence.startTime;
          onTimeUpdate(nextSentence.startTime);
        } else {
          // 沒有更多句子，停止播放
          console.log('所有Highlight片段播放完畢，停止播放');
          onPause();
        }
      }else{
        onTimeUpdate(target.currentTime);
      }

      // 如果當前句子播放完畢，檢查是否需要跳轉到下一個句子
      // if (newTime >= playingSentence.endTime) {
      //   const nextSentence = getNextSentence(newTime);

      //   if (nextSentence) {
      //     // 跳轉到下一個句子的開始時間
      //     console.log(`當前片段結束，跳轉到下一個: ${nextSentence.startTime}s`);
      //     return nextSentence.startTime;
      //   } else {
      //     // 沒有更多句子，停止播放
      //     console.log('所有Highlight片段播放完畢，停止播放');
      //     setIsPlaying(false);
      //     clearInterval(interval);
      //     return playingSentence.endTime;
      //   }
      // }

      
    }
  };

  const getCurrentSubtitle = (): string => {
    if (selectedSentences.length === 0) return '';
    const currentSentence = selectedSentences.find((sentence) => currentTime >= sentence.startTime && currentTime <= sentence.endTime);
    return currentSentence?.text || '';
  };

  const getHighlightSegments = () => {
    const totalDuration = duration > 0 ? duration : aiResult.totalDuration;

    return selectedSentences.map((sentence) => ({
      left: (sentence.startTime / totalDuration) * 100,
      width: ((sentence.endTime - sentence.startTime) / totalDuration) * 100,
      sentence,
    }));
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const totalDuration = duration > 0 ? duration : aiResult.totalDuration;
    const newTime = percentage * totalDuration;
    onTimeUpdate(newTime);
  };

  const currentSubtitle = getCurrentSubtitle();
  

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* 標題欄 */}
      <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">預覽區域</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <span>已選片段: {selectedSentences.length}</span>
              <span>預計時長: {formatTime(selectedSentences.reduce((acc, s) => acc + (s.endTime - s.startTime), 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 影片播放區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {videoUrl ? (
          <div className="relative w-full h-full">
            <ReactPlayerWrapper
              ref={playerRef}
              src={videoUrl}
              playing={isPlaying}
              volume={1}
              muted={false}
              controls={false}
              width="100%"
              height="100%"
              onStart={handleStart}
              onTimeUpdate={handleTimeUpdate}
              onReady={handleReady}
              onError={handleError}
              onCanPlay={handleCanPlay}
              onPlay={onPlay} // TODO 待優化
              onPause={onPause} // TODO 待優化
              onEnded={onPause} // TODO 待優化
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
            <p className="text-gray-500">如果影片沒有顯示，請檢查文件格式是否支援</p>
          </div>
        )}
      </div>

      {/* 時間軸和控制區域 */}
      <div className="flex-shrink-0 bg-gray-800 p-4 space-y-4">
        {/* Highlight時間軸 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Highlight 時間軸</span>
            <span>
              {formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}
            </span>
          </div>

          <div className="relative h-8 bg-gray-700 rounded-lg cursor-pointer" onClick={handleProgressClick}>
            {/* 背景軌道 */}
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              {/* Highlight片段 */}
              {getHighlightSegments().map((segment, index) => (
                <div
                  key={index}
                  className="absolute top-0 h-full bg-blue-500 opacity-60"
                  style={{
                    left: `${segment.left}%`,
                    width: `${segment.width}%`,
                  }}
                  title={segment.sentence.text}
                />
              ))}
            </div>

            {/* 當前時間指示器 */}
            <div
              className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full transform -translate-x-1/2"
              style={{
                left: `${(currentTime / (duration > 0 ? duration : aiResult.totalDuration)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* 播放控制 */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => {
              if (selectedSentences.length > 0) {
                const prevSentence = selectedSentences
                  .slice()
                  .reverse()
                  .find((s) => s.startTime < currentTime);
                if (prevSentence) {
                  onTimeUpdate(prevSentence.startTime);
                }
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            disabled={selectedSentences.length === 0}
            title="上一個片段"
          >
            <ArrowBigLeftIcon className="w-6 h-6" />
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`p-3 rounded-full transition-colors ${selectedSentences.length === 0 ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            disabled={selectedSentences.length === 0}
            title={selectedSentences.length === 0 ? '請先選擇Highlight片段' : isPlaying ? '暫停' : '播放'}
          >
            {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
          </button>

          <button
            onClick={() => {
              if (selectedSentences.length > 0) {
                // Note: 已經排序過的 selectedSentences ，所以可以這樣找
                const nextSentence = selectedSentences.find((s) => s.startTime > currentTime);
                if (nextSentence && playerRef.current) {
                  playerRef.current.currentTime = nextSentence.startTime;
                }
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            disabled={selectedSentences.length === 0}
            title="下一個片段"
          >
            <ArrowBigRightIcon className="w-6 h-6" />
          </button>
        </div>
        {/* 片段信息 */}
        <div className="text-center text-sm text-gray-300">
          {selectedSentences.length > 0 ? (
            <p>
              已選擇 {selectedSentences.length} 個片段， 總時長約 {formatTime(selectedSentences.reduce((acc, s) => acc + (s.endTime - s.startTime), 0))}
            </p>
          ) : (
            <p className="text-yellow-400">⚠️ 請在左側編輯區域選擇要播放的Highlight片段</p>
          )}
        </div>
      </div>
    </div>
  );
}
