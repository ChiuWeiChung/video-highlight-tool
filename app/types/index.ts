// 轉錄文本句子類型
export interface TranscriptSentence {
  id: string;
  text: string;
  startTime: number; // 秒
  endTime: number; // 秒
  isHighlight: boolean; // 是否為建議的Highlight句子
  isSelected: boolean; // 用戶是否選中
}

// 章節類型
export interface TranscriptSection {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  sentences: TranscriptSentence[];
}

// AI 處理結果類型
export interface AIProcessResult {
  videoId: string;
  fullTranscript: string;
  sections: TranscriptSection[];
  totalDuration: number; // 影片總時長（秒）
  processingTime: number; // 處理時間（毫秒）
}

// API 回應類型
export interface MockAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}
