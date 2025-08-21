import { useState, useCallback } from 'react';
import VideoUpload from '../VideoUpload';
import EditingArea from '../EditingArea';
import PreviewArea from '../PreviewArea';
import { MockAIService } from '../../services/mockAI';
import type { AIProcessResult } from '../../types';

export default function Main() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [aiResult, setAiResult] = useState<AIProcessResult | null>(null);
  const [error, setError] = useState<string>('');
  
  // 播放器狀態
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackInterval, setPlaybackInterval] = useState<NodeJS.Timeout | null>(null);

  const handleVideoUpload = async (file: File) => {
    setError('');
    setIsUploading(true);
    setUploadProgress(0);
    
    // 模擬上傳進度
    const uploadInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setIsUploading(false);
          setUploadedVideo(file);
          // 上傳完成後自動開始 AI 處理
          handleAIProcessing(file);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleAIProcessing = async (file: File) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setError('');

    try {
      const result = await MockAIService.processVideo(file, (progress) => {
        setProcessingProgress(progress);
      });
      console.log('result', result);

      if (result.success && result.data) {
        setAiResult(result.data);
        console.log('AI 處理結果:', result.data);
      } else {
        setError(result.error || '處理失敗');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知錯誤');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartOver = () => {
    setUploadedVideo(null);
    setUploadProgress(0);
    setProcessingProgress(0);
    setAiResult(null);
    setError('');
    setCurrentTime(0);
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
  };

  // 句子選擇處理
  const handleSentenceSelect = useCallback((sentenceId: string, isSelected: boolean) => {
    if (!aiResult) return;
    
    const updatedResult = MockAIService.updateSentenceSelection(aiResult, sentenceId, isSelected);
    setAiResult(updatedResult);
  }, [aiResult]);

  // 時間戳點擊處理
  const handleTimestampClick = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  // 獲取所有選中的句子，按時間排序
  const getSelectedSentences = useCallback(() => {
    if (!aiResult) return [];
    return aiResult.sections
      .flatMap(section => section.sentences)
      .filter(sentence => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  }, [aiResult]);

  // 查找當前時間點應該播放的句子
  const getCurrentPlayingSentence = useCallback((time: number) => {
    const selectedSentences = getSelectedSentences();
    return selectedSentences.find(sentence => 
      time >= sentence.startTime && time <= sentence.endTime
    );
  }, [getSelectedSentences]);

  // 查找下一個要播放的句子
  const getNextSentence = useCallback((time: number) => {
    const selectedSentences = getSelectedSentences();
    return selectedSentences.find(sentence => sentence.startTime > time);
  }, [getSelectedSentences]);

  // 播放控制
  const handlePlay = useCallback(() => {
    if (!aiResult) return;
    
    const selectedSentences = getSelectedSentences();
    if (selectedSentences.length === 0) {
      console.log('沒有選中的Highlight片段，無法播放');
      return;
    }

    // 如果當前時間不在任何選中句子範圍內，跳轉到第一個選中句子
    const currentSentence = getCurrentPlayingSentence(currentTime);
    if (!currentSentence) {
      const firstSentence = selectedSentences[0];
      setCurrentTime(firstSentence.startTime);
    }
    
    setIsPlaying(true);
    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const newTime = prev + 0.1;
        
        // 檢查是否還在選中的句子範圍內
        const playingSentence = getCurrentPlayingSentence(newTime);
        
        if (!playingSentence) {
          // 不在選中句子範圍內，查找下一個句子
          const nextSentence = getNextSentence(newTime);
          
          if (nextSentence) {
            // 跳轉到下一個句子的開始時間
            console.log(`跳轉到下一個Highlight片段: ${nextSentence.startTime}s`);
            return nextSentence.startTime;
          } else {
            // 沒有更多句子，停止播放
            console.log('所有Highlight片段播放完畢，停止播放');
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
        }
        
        // 如果當前句子播放完畢，檢查是否需要跳轉到下一個句子
        if (newTime >= playingSentence.endTime) {
          const nextSentence = getNextSentence(newTime);
          
          if (nextSentence) {
            // 跳轉到下一個句子的開始時間
            console.log(`當前片段結束，跳轉到下一個: ${nextSentence.startTime}s`);
            return nextSentence.startTime;
          } else {
            // 沒有更多句子，停止播放
            console.log('所有Highlight片段播放完畢，停止播放');
            setIsPlaying(false);
            clearInterval(interval);
            return playingSentence.endTime;
          }
        }
        
        return newTime;
      });
    }, 100);
    setPlaybackInterval(interval);
  }, [aiResult, currentTime, getSelectedSentences, getCurrentPlayingSentence, getNextSentence]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    if (playbackInterval) {
      clearInterval(playbackInterval);
      setPlaybackInterval(null);
    }
  }, [playbackInterval]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            影片 Highlight 編輯工具
          </h1>
          <p className="text-gray-600">
            上傳您的影片，使用 AI 技術自動生成精彩片段
          </p>
        </div>

        {!uploadedVideo ? (
          <VideoUpload
            onVideoUpload={handleVideoUpload}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        ) : !aiResult ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  處理狀態
                </h2>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isProcessing}
                >
                  重新開始
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 影片上傳狀態 */}
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isProcessing 
                        ? 'bg-blue-100' 
                        : 'bg-gray-100'
                    }`}>
                      {isProcessing ? (
                        <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {isProcessing ? 'AI 處理中...' : '等待 AI 處理'}
                    </h3>
                    {isProcessing && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${processingProgress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{Math.round(processingProgress)}%</p>
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
          <div className="h-screen flex flex-col">
            {/* 頂部工具欄 */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-xl font-semibold text-gray-900">
                    影片 Highlight 編輯器
                  </h1>
                  <div className="text-sm text-gray-500">
                    {uploadedVideo.name}
                  </div>
                </div>
                <button
                  onClick={handleStartOver}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  重新開始
                </button>
              </div>
            </div>

            {/* 分屏內容區域 */}
            <div className="flex-1 flex overflow-hidden">
              {/* 左側：編輯區域 */}
              <div className="w-1/2 border-r border-gray-200">
                <EditingArea
                  aiResult={aiResult}
                  onSentenceSelect={handleSentenceSelect}
                  onTimestampClick={handleTimestampClick}
                  currentTime={currentTime}
                  className="h-full"
                />
              </div>

              {/* 右側：預覽區域 */}
              <div className="w-1/2">
                <PreviewArea
                  aiResult={aiResult}
                  uploadedVideo={uploadedVideo}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  isPlaying={isPlaying}
                  selectedSentences={getSelectedSentences()}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

