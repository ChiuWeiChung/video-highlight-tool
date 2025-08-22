import type { AIProcessResult, TranscriptSentence, TranscriptSection, MockAPIResponse } from '../types';

// 獲取模擬數據
const fetchMockTranscriptData = async (file: File): Promise<TranscriptSection[]> => {
  try {
    console.log('Mock AI: 開始獲取模擬數據...', file.name);
    const response = await fetch('./mockTranscriptData.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ 無法載入模擬數據:', error);
    // 如果 fetch 失敗，返回空數組或拋出錯誤
    throw new Error('無法載入模擬轉錄數據');
  }
};

// 生成隨機的處理時間（模擬 AI 處理）
const generateProcessingTime = (): number => {
  return 1000; // 1 秒
};

// 生成唯一 ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 將模擬數據轉換為 API 格式
const convertToAPIFormat = async (videoFile: File): Promise<AIProcessResult> => {
  const videoId = generateId();
  const sections: TranscriptSection[] = [];
  let sentenceIdCounter = 0;

  // 非同步獲取模擬數據
  const mockData = await fetchMockTranscriptData(videoFile);

  mockData.forEach((sectionData, sectionIndex) => {
    const sentences: TranscriptSentence[] = sectionData.sentences.map((sentence) => ({
      id: `sentence_${sentenceIdCounter++}`,
      text: sentence.text,
      startTime: sentence.startTime,
      isHighlight: sentence.isHighlight,
      isSelected: sentence.isHighlight, // 預設選中建議的 Highlight 字幕
    }));

    const section: TranscriptSection = {
      id: `section_${sectionIndex}`,
      title: sectionData.title,
      startTime: sentences[0].startTime,
      sentences,
    };

    sections.push(section);
  });

  // 生成完整轉錄文本
  const fullTranscript = sections.map((section) => section.sentences.map((sentence) => sentence.text).join(' ')).join(' ');

  return {
    videoId,
    fullTranscript,
    sections,
    processingTime: generateProcessingTime(),
  };
};

// 模擬 AI 處理延遲
const simulateProcessingDelay = (duration: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};

// Mock AI API 服務
export class MockAIService {
  /** 模擬 AI 處理影片並返回轉錄文本 */
  static async processVideo(videoFile: File, onProgress?: (progress: number) => void): Promise<MockAPIResponse<AIProcessResult>> {
    try {
      // 模擬處理進度
      if (onProgress) {
        const progressInterval = setInterval(() => {
          const currentProgress = Math.random() * 20 + 40; // 10-30% 隨機進度
          onProgress(currentProgress);
        }, 300);

        // 模擬處理時間
        const processingTime = generateProcessingTime();
        await simulateProcessingDelay(processingTime);

        clearInterval(progressInterval);
        onProgress(100);
      } else await simulateProcessingDelay(generateProcessingTime());

      // 生成模擬結果（非同步獲取 JSON 數據）
      const result = await convertToAPIFormat(videoFile);

      return {
        success: true,
        data: result,
        message: '影片處理成功！已生成轉錄文本和Highlight建議。',
      };
    } catch (error) {
      console.error('❌ Mock AI: 處理失敗', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        message: '影片處理失敗，請重試。',
      };
    }
  }

  /** 更新字幕選擇狀態 */
  static updateSentenceSelection(result: AIProcessResult, sentenceId: string, isSelected: boolean): AIProcessResult {
    const updatedSections = result.sections.map((section) => ({
      ...section,
      sentences: section.sentences.map((sentence) => (sentence.id === sentenceId ? { ...sentence, isSelected } : sentence)),
    }));

    return {
      ...result,
      sections: updatedSections,
    };
  }

  /** 獲取選中的字幕列表 */
  static getSelectedSentences(result: AIProcessResult): TranscriptSentence[] {
    return result.sections
      .flatMap((section) => section.sentences)
      .filter((sentence) => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  }
}
