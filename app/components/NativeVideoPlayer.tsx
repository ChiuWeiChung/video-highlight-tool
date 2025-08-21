import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

interface NativeVideoPlayerProps {
  url: string;
  playing: boolean;
  volume: number;
  muted: boolean;
  width: string;
  height: string;
  onProgress: (state: { playedSeconds: number; played: number; loadedSeconds: number; loaded: number }) => void;
  onDuration: (duration: number) => void;
  onReady: () => void;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  style?: React.CSSProperties;
}

const NativeVideoPlayer = forwardRef<any, NativeVideoPlayerProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // 暴露給父組件的方法
  useImperativeHandle(ref, () => ({
    seekTo: (time: number) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    getCurrentTime: () => {
      return videoRef.current?.currentTime || 0;
    },
    getDuration: () => {
      return videoRef.current?.duration || 0;
    }
  }));

  // 處理播放/暫停
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (props.playing) {
      video.play().catch(error => {
        console.error('播放失敗:', error);
        props.onError?.(error);
      });
    } else {
      video.pause();
    }
  }, [props.playing]);

  // 處理音量
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.volume = props.volume;
      video.muted = props.muted;
    }
  }, [props.volume, props.muted]);

  // 設置進度回調
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (props.playing) {
      progressInterval.current = setInterval(() => {
        if (video && !video.paused) {
          const currentTime = video.currentTime;
          const duration = video.duration || 0;
          props.onProgress({
            playedSeconds: currentTime,
            played: duration > 0 ? currentTime / duration : 0,
            loadedSeconds: currentTime,
            loaded: duration > 0 ? currentTime / duration : 0
          });
        }
      }, 100);
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [props.playing, props.onProgress]);

  return (
    <video
      ref={videoRef}
      src={props.url}
      style={{
        width: props.width,
        height: props.height,
        objectFit: 'contain',
        ...props.style
      }}
      onLoadStart={() => {
        console.log('Native video: 開始載入');
        props.onLoadStart?.();
      }}
      onCanPlay={() => {
        console.log('Native video: 可以播放');
        props.onCanPlay?.();
        props.onReady();
      }}
      onLoadedMetadata={() => {
        const video = videoRef.current;
        if (video && video.duration) {
          console.log('Native video: 載入元數據，時長:', video.duration);
          props.onDuration(video.duration);
        }
      }}
      onPlay={() => {
        console.log('Native video: 開始播放');
        props.onPlay();
      }}
      onPause={() => {
        console.log('Native video: 暫停播放');
        props.onPause();
      }}
      onEnded={() => {
        console.log('Native video: 播放結束');
        props.onEnded();
      }}
      onError={(e) => {
        console.error('Native video: 播放錯誤', e);
        props.onError?.(e);
      }}
      
    />
  );
});

NativeVideoPlayer.displayName = 'NativeVideoPlayer';

export default NativeVideoPlayer;



// const demo = () => {
//   return (
//     <NativeVideoPlayer
//       ref={playerRef}
//       url={videoUrl}
//       playing={isPlaying}
//       volume={1}
//       muted={false}
//       width="100%"
//       height="100%"
//       onProgress={handleProgress}
//       onDuration={handleDuration}
//       onReady={handleReady}
//       onError={handleError}
//       onLoadStart={handleLoadStart}
//       onCanPlay={handleCanPlay}
//       onPlay={() => {
//         console.log('Native: 播放開始');
//         onPlay();
//       }}
//       onPause={() => {
//         console.log('Native: 播放暫停');
//         onPause();
//       }}
//       onEnded={() => {
//         onPause();
//         console.log('Native: 影片播放結束');
//       }}
//       style={{
//         position: 'absolute',
//         top: 0,
//         left: 0,
//       }}
//     />
//   );
// };