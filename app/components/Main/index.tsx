import { useState, useCallback, useMemo, useRef } from 'react';
import VideoUpload from '../VideoUpload';
import EditingArea from '../EditingArea';
import PreviewArea from '../PreviewArea';
import { MockAIService } from '../../services/mockAI';
import type { AIProcessResult } from '../../types';
import { CheckIcon, ClockIcon, Loader2Icon } from 'lucide-react';

export default function Main() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [processState, setProcessState] = useState<{ isProcess: boolean; progress: number }>({ isProcess: false, progress: 0 });
  const [highlightClips, setHighlightClips] = useState<AIProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  const playerRef = useRef<HTMLVideoElement>(null);
  // 播放器當前播放時間
  const [currentTime, setCurrentTime] = useState(0);

  const handleVideoUpload = async (file: File) => {
    setError('');
    setUploadedVideo(file); // 儲存影片詳細資訊
    handleAIProcessing(file); // 上傳完成後自動開始模擬 AI 處理
  };

  const handleAIProcessing = async (file: File) => {
    setProcessState({isProcess:true, progress:0});
    setError('');

    try {
      const result = await MockAIService.processVideo(file, (progress) => {
        setProcessState((prev) => ({...prev, progress}));
      });

      if (result.success && result.data) {
        setHighlightClips(result.data);
        console.log('AI 處理結果:', result.data);
      } else {
        setError(result.error || '處理失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setProcessState((prev) => ({...prev, isProcess:false}));
    }
  };

  const handleStartOver = () => {
    setUploadedVideo(null);
    setProcessState({isProcess:false, progress:0});
    setHighlightClips(null);
    setError('');
    setCurrentTime(0);
  };

  // 字幕選擇處理
  const handleSentenceSelect = useCallback((sentenceId: string, isSelected: boolean) => {
    if (!highlightClips) return;
    const updatedResult = MockAIService.updateSentenceSelection(highlightClips, sentenceId, isSelected);
    setHighlightClips(updatedResult);
  }, [highlightClips]);

  // 時間戳點擊處理
  const handleTimestampClick = useCallback((time: number) => {
    setCurrentTime(time);
    if (playerRef.current) playerRef.current.currentTime = time;
  }, []);

  // TODO 應該在 API RESPONSE 中就排序好，這樣就不用每次都排序  
  // 獲取所有選中的字幕，按時間排序
  const selectedSentences = useMemo(() => {
    if (!highlightClips) return [];
    return highlightClips.sections
      .flatMap(section => section.sentences)
      .filter(sentence => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  }, [highlightClips]);

  // 查找當前時間點應該播放的字幕
  const getHighlightSentenceByTime = useCallback((time: number) => {
    return selectedSentences.find(({ startTime, endTime }) => time >= startTime && time <= endTime);
  }, [selectedSentences]);

  // 查找下一個要播放的字幕
  const getNextSentence = useCallback((time: number) => {
    return selectedSentences.find(sentence => sentence.startTime > time);
  }, [selectedSentences]);

  // 查找前一個要播放的字幕
  const getPreviousSentence = useCallback((time: number) => {
    const currentIndex = selectedSentences.findIndex(sentence => time >= sentence.startTime && time <= sentence.endTime);
    // 如果當前時間在選中的字幕範圍內，則返回前一個字幕
    if(currentIndex >= 0) return selectedSentences[currentIndex - 1];
    return selectedSentences[0];
  }, [selectedSentences]);

 
  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  return (
    <main className="min-h-screen h-screen bg-gray-50 p-4">
      <div className="container h-full mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">影片 Highlight 生成工具</h1>
        </div>

        {!uploadedVideo ? (
          <VideoUpload onVideoUpload={handleVideoUpload} />
        ) : !highlightClips ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">處理狀態</h2>
              </div>

              <div className="space-y-6">
                {/* 影片上傳狀態 */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">影片上傳完成</h3>
                    <p className="text-sm text-gray-500">
                      {uploadedVideo.name} ({(uploadedVideo.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  </div>
                </div>

                {/* AI 處理狀態 */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${processState.isProcess ? 'bg-blue-100' : 'bg-gray-100'}`}>
                      {processState.isProcess ? <Loader2Icon className="w-6 h-6 text-blue-600 animate-spin" /> : <ClockIcon className="w-6 h-6 text-gray-400" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">{processState.isProcess ? 'AI 處理中...' : '等待 AI 處理'}</h3>
                    {processState.isProcess && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${processState.progress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{Math.round(processState.progress)}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 錯誤訊息 */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">❌ {error}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* 分屏編輯界面 */
          <div className="flex flex-col gap-4">
            {/* 頂部工具欄 */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{uploadedVideo.name}</span>
                <button onClick={handleStartOver} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                  重新上傳
                </button>
              </div>
            </header>

            {/* 分屏內容區域 */}
            {/* <div className="flex-1 flex md:flex-row flex-col gap-4 overflow-hidden"> */}
            <div className="flex md:flex-row flex-col gap-4 overflow-hidden">
              {/* 左側：編輯區域 */}
              <EditingArea
                highlightClips={highlightClips}
                onSentenceSelect={handleSentenceSelect}
                getHighlightSentenceByTime={getHighlightSentenceByTime}
                onTimestampClick={handleTimestampClick}
                currentTime={currentTime}
              />

              {/* 右側：預覽區域 */}

              <PreviewArea
                ref={playerRef}
                uploadedVideo={uploadedVideo}
                currentTime={currentTime}
                setCurrentTime={setCurrentTime}
                selectedSentences={selectedSentences}
                getHighlightSentenceByTime={getHighlightSentenceByTime}
                getNextSentence={getNextSentence}
                getPreviousSentence={getPreviousSentence}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

