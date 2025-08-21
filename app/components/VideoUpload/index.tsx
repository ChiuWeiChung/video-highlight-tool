import { Loader2Icon, UploadIcon } from 'lucide-react';
import React, { useState, useCallback, useRef } from 'react';
import { MAX_FILE_SIZE, SUPPORTED_FORMATS } from '~/constant/video';

interface VideoUploadProps {
  onVideoUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export default function VideoUpload({ onVideoUpload, isUploading = false, uploadProgress = 0 }: VideoUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string => {
    if (!SUPPORTED_FORMATS.includes(file.type)) return '不支持的文件格式。請上傳 MP4、WebM、OGG、AVI、MOV 或 MKV 格式的影片文件。';
    if (file.size > MAX_FILE_SIZE) return '文件大小超出限制。請上傳小於 500MB 的影片文件。';
    return '';
  };

  const handleFileSelect = useCallback(
    (file: File) => {
      setError('');
      const validationError = validateFile(file);
      if (!validationError) onVideoUpload(file);
      else setError(validationError);
    },
    [onVideoUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  // 拖拽上傳
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect],
  );

  // 選擇文件上傳
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect],
  );

  // 點擊上傳
  const handleClick = useCallback(() => {
    if (!isUploading) fileInputRef.current?.click();
  }, [isUploading]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInputChange} className="hidden" disabled={isUploading} />

        {isUploading ? (
          <div className="space-y-4">
            <Loader2Icon className="w-16 h-16 text-blue-500 animate-spin mx-auto" />

            <div>
              <p className="text-lg font-medium text-gray-700">正在上傳影片...</p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <UploadIcon className="w-16 h-16 mx-auto text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">拖拽影片文件到此處或點擊上傳</p>
              <p className="text-sm text-gray-500 mt-2">支持 MP4、WebM、OGG、AVI、MOV、MKV 格式，最大 500MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
