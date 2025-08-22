// 轉錄文本字幕類型
export interface TranscriptSentence {
  id: string;
  text: string;
  startTime: number; // 秒
  isHighlight: boolean; // 是否為建議的Highlight 字幕
  isSelected: boolean; // 用戶是否選中
}

// 章節類型
export interface TranscriptSection {
  id: string;
  title: string;
  startTime: number;
  sentences: TranscriptSentence[];
}

// AI 處理結果類型
export interface AIProcessResult {
  videoId: string;
  fullTranscript: string;
  sections: TranscriptSection[];
}

// API 回應類型
export interface MockAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
}
