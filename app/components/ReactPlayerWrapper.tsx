// ReactPlayer 包裝組件，解決類型問題
import React, { forwardRef } from 'react';
import ReactPlayer from 'react-player'; // 使用完整的 ReactPlayer
import type { ReactPlayerProps } from 'react-player/types';

// interface ReactPlayerWrapperProps {
//   src: string;
//   playing?: boolean;
//   volume: number;
//   muted: boolean;
//   controls: boolean;
//   width: string;
//   height: string;
//   onProgress: (state: { playedSeconds: number; played: number; loadedSeconds: number; loaded: number }) => void;
//   onDuration?: (duration: number) => void;
//   onReady?: () => void;
//   onError?: (error: any) => void;
//   onLoadStart?: () => void;
//   onCanPlay?: () => void;
//   onPlay: () => void;
//   onPause: () => void;
//   onEnded: () => void;
//   style?: React.CSSProperties;
// }

const ReactPlayerWrapper = forwardRef<any, ReactPlayerProps>((props, ref) => {
  return (
    <ReactPlayer
      ref={ref}
      //   onDuration={props.onDuration}
      {...props}
    />
  );
});

export default ReactPlayerWrapper;
