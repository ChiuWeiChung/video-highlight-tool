import React, { useState, useRef, useEffect, type ReactEventHandler } from 'react';
import ReactPlayerWrapper from '../ReactPlayerWrapper';
import NativeVideoPlayer from '../NativeVideoPlayer';
import type { AIProcessResult, TranscriptSentence } from '../../types';
import ReactPlayer from 'react-player';
// React Player 類型定義
interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

interface PreviewAreaProps {
  aiResult: AIProcessResult | null;
  uploadedVideo: File | null;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  selectedSentences?: TranscriptSentence[];
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
  selectedSentences = [],
  className = ""
}: PreviewAreaProps) {
  
  const playerRef = useRef<any>(null);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [useNativePlayer, setUseNativePlayer] = useState(false);

  // 創建影片 URL
  useEffect(() => {
    if (uploadedVideo) {
      const url = URL.createObjectURL(uploadedVideo);
      // console.log('Created video URL:', url);
      // console.log('Video file type:', uploadedVideo.type);
      // console.log('Video file size:', uploadedVideo.size);
      setVideoUrl(url);
      setPlayerReady(false); // 重置播放器狀態
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [uploadedVideo]);

  // 同步播放時間
  useEffect(() => {
    const player = playerRef.current;
    if (player && playerReady) {
      // 檢查播放器是否已準備好且有必要的方法
      if (typeof player.seekTo === 'function' && typeof player.getCurrentTime === 'function') {
        try {
          const currentPlayerTime = player.getCurrentTime();
          if (Math.abs(currentPlayerTime - currentTime) > 0.5) {
            console.log(`同步播放時間: ${currentPlayerTime}s → ${currentTime}s`);
            player.seekTo(currentTime, 'seconds');
          }
        } catch (error) {
          console.error('播放器時間同步錯誤:', error);
        }
      }
    }
  }, [currentTime, playerReady]);

  // 處理播放器時間更新
  const handleProgress = (props: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.log('handleProgress', props);
    // 只有在播放時才更新時間，避免循環更新
    // TODO 待修復
    // if (isPlaying && Math.abs(state.playedSeconds - currentTime) > 0.1) {
    //   onTimeUpdate(state.playedSeconds);
    // }
  };

  // const handleDuration = (duration: number) => {
  const handleDuration = (props: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.log('handleDuration', props);
    // TODO 取得 duration
    // const duration = props.target.duration;
    // setDuration(duration);
  };

  const handleReady = () => {
    console.log('播放器已準備就緒');
    setPlayerReady(true);
  };

  const handleError = (error: any) => {
    console.error('播放器錯誤:', error);
    // 如果 ReactPlayer 失敗，嘗試使用原生播放器
    if (!useNativePlayer) {
      console.log('切換到原生影片播放器');
      setUseNativePlayer(true);
      setPlayerReady(false);
    }
  };

  const handleLoadStart = () => {
    console.log('開始載入影片');
  };

  const handleCanPlay = () => {
    console.log('影片可以播放');
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentSubtitle = (): string => {
    if (!aiResult || selectedSentences.length === 0) return '';
    const currentSentence = selectedSentences.find(
      sentence => currentTime >= sentence.startTime && currentTime <= sentence.endTime
    );
    return currentSentence?.text || '';
  };

  const getHighlightSegments = () => {
    const totalDuration = duration > 0 ? duration : (aiResult?.totalDuration || 100);
    
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
    const totalDuration = duration > 0 ? duration : (aiResult?.totalDuration || 100);
    const newTime = percentage * totalDuration;
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
            <button
              onClick={() => {
                setUseNativePlayer(!useNativePlayer);
                setPlayerReady(false);
              }}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
            >
              {useNativePlayer ? '切換到 ReactPlayer' : '切換到原生播放器'}
            </button>
          </div>
        </div>
      </div>

      {/* 影片播放區域 */}
      <div className="flex-1 relative bg-black flex items-center justify-center">
        {videoUrl ? (
          <div className="relative w-full h-full">
            {/* <NativeVideoPlayer
              ref={playerRef}
              url={videoUrl}
              playing={isPlaying}
              volume={1}
              muted={false}
              width="100%"
              height="100%"
              onProgress={handleProgress}
              onDuration={handleDuration}
              onReady={handleReady}
              onError={handleError}
              onLoadStart={handleLoadStart}
              onCanPlay={handleCanPlay}
              onPlay={() => {
                console.log('Native: 播放開始');
                onPlay();
              }}
              onPause={() => {
                console.log('Native: 播放暫停');
                onPause();
              }}
              onEnded={() => {
                onPause();
                console.log('Native: 影片播放結束');
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            /> */}
            <ReactPlayerWrapper
              ref={playerRef}
              src={videoUrl}
              playing={isPlaying}
              volume={1}
              muted={false}
              controls={true}
              width="100%"
              height="100%"
              onProgress={handleProgress}
              onDurationChange={handleDuration}
              onReady={handleReady}
              onError={handleError}
              onLoadStart={handleLoadStart}
              onCanPlay={handleCanPlay}
              onPlay={() => {
                console.log('ReactPlayer: 播放開始');
                onPlay();
              }}
              onPause={() => {
                console.log('ReactPlayer: 播放暫停');
                onPause();
              }}
              onEnded={() => {
                onPause();
                console.log('ReactPlayer: 影片播放結束');
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
            />

            {/* 字幕覆蓋層 */}
            {currentSubtitle && (
              <div className="absolute bottom-15 opacity-50 w-full left-1/2 transform -translate-x-1/2 max-w-4xl px-4 z-10">
                <div className="bg-black bg-opacity-75 rounded-lg px-6 py-3">
                  <p className="text-white text-center text-lg leading-relaxed font-medium">{currentSubtitle}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 載入中狀態 */
          <div className="text-center text-gray-400">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-800 rounded-lg flex items-center justify-center">
              <svg className="w-12 h-12 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-lg font-medium">正在載入影片...</p>
            <p className="text-sm mt-1">{uploadedVideo?.name}</p>
            <p className="text-xs text-gray-500 mt-2">如果影片沒有顯示，請檢查文件格式是否支援</p>
          </div>
        )}
      </div>

      {/* 時間軸和控制區域 */}
      <div className="flex-shrink-0 bg-gray-800 p-4 space-y-4">
        {/* Highlight時間軸 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Highlight片段時間軸</span>
            <span>
              {formatTime(currentTime)} / {formatTime(duration > 0 ? duration : aiResult.totalDuration)}
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
        {/* <div className="flex items-center justify-center space-x-4">
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
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <button
            onClick={isPlaying ? onPause : onPlay}
            className={`p-3 rounded-full transition-colors ${selectedSentences.length === 0 ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
            disabled={selectedSentences.length === 0}
            title={selectedSentences.length === 0 ? '請先選擇Highlight片段' : isPlaying ? '暫停' : '播放'}
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
            onClick={() => {
              if (selectedSentences.length > 0) {
                const nextSentence = selectedSentences.find((s) => s.startTime > currentTime);
                if (nextSentence) {
                  onTimeUpdate(nextSentence.startTime);
                }
              }
            }}
            className="p-2 text-gray-300 hover:text-white transition-colors disabled:opacity-50"
            disabled={selectedSentences.length === 0}
            title="下一個片段"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div> */}

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
