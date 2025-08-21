import { useState } from 'react';
import VideoUpload from '../VideoUpload';
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
  };

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
        ) : (
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
                        : aiResult 
                          ? 'bg-green-100' 
                          : 'bg-gray-100'
                    }`}>
                      {isProcessing ? (
                        <svg className="animate-spin w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : aiResult ? (
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
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
                      {isProcessing ? 'AI 處理中...' : aiResult ? 'AI 處理完成' : '等待 AI 處理'}
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

                {/* AI 處理結果 */}
                {aiResult && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900">處理結果</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">章節數量</h4>
                        <p className="text-2xl font-bold text-blue-600">{aiResult.sections.length}</p>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-green-900 mb-1">建議高亮</h4>
                        <p className="text-2xl font-bold text-green-600">
                          {aiResult.sections.reduce((acc, section) => 
                            acc + section.sentences.filter(s => s.isHighlight).length, 0
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-purple-900 mb-1">總時長</h4>
                        <p className="text-2xl font-bold text-purple-600">
                          {Math.round(aiResult.totalDuration)}s
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">章節預覽</h4>
                      <div className="space-y-2">
                        {aiResult.sections.map((section, index) => (
                          <div key={section.id} className="flex items-center space-x-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center justify-center">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{section.title}</p>
                              <p className="text-xs text-gray-500">
                                {Math.round(section.startTime)}s - {Math.round(section.endTime)}s 
                                ({section.sentences.length} 句)
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-green-800 text-sm">
                        🎉 AI 處理完成！已生成 {aiResult.sections.length} 個章節和轉錄文本。
                        現在可以開始編輯高亮片段了。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

