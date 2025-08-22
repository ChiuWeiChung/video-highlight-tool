import type { AIProcessResult, TranscriptSentence, TranscriptSection, MockAPIResponse } from '@/types';

// 獲取模擬數據
const fetchMockJSONData = async (file: File): Promise<TranscriptSection[]> => {
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
  const mockData = await fetchMockJSONData(videoFile);

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
    fullTranscript, // Full video transcript (但專案內沒有使用到)
    sections, // Transcript split into sections/ Titles for each section/ Suggested Highlight sentences
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

  /** 取得含有所有字幕的列表 */
  static getAllSentences(result: AIProcessResult): TranscriptSentence[] {
    return result.sections.flatMap((section) => section.sentences).sort((a, b) => a.startTime - b.startTime);
  }

  /** 獲取選中的字幕列表 */
  static getSelectedSentences(result: AIProcessResult): TranscriptSentence[] {
    const sentences = this.getAllSentences(result);
    return sentences.filter((sentence) => sentence.isSelected);
  }

  /** 查找當前時間點應該播放的字幕 */
  static getSelectedSentenceByTime(result: AIProcessResult, time: number): TranscriptSentence | undefined {
    const selectedSentences = this.getSelectedSentences(result);

    // 找到開始時間小於等於當前時間的句子，然後取最後一個（最接近的）
    const validSentences = selectedSentences.filter((sentence) => sentence.startTime <= time);
    if (validSentences.length === 0) return undefined;

    // 找到下一個句子的開始時間，以此作為當前句子的結束時間
    const currentSentence = validSentences[validSentences.length - 1];
    const currentIndex = selectedSentences.indexOf(currentSentence);
    const nextSentence = selectedSentences[currentIndex + 1];

    // 如果有下一個句子，檢查當前時間是否在當前句子的範圍內
    if (nextSentence && time >= nextSentence.startTime) {
      return undefined; // 當前時間已超過當前句子，不在任何句子範圍內
    }

    return currentSentence;
  }

  /** 取得 Highlight 時間總長度 */
  static getHighlightDuration(result: AIProcessResult, duration: number): number {
    const allSentences = this.getAllSentences(result);
    const selectedSentences = allSentences.filter((sentence) => sentence.isSelected);

    let highlightDuration = 0;

    // 遍歷每個已選取的字幕
    for (const item of selectedSentences) {
      let localDuration = 0;

      // 在所有字幕中找到當前已選取字幕的位置
      const currentIndex = allSentences.findIndex((sentence) => sentence.id === item.id);

      if (currentIndex === allSentences.length - 1) {
        // 如果是最後一句字幕：使用影片總長度減去當前字幕開始時間
        localDuration = duration - item.startTime;
      } else {
        // 一般情況：下一句字幕（在所有字幕中的下一句）的開始時間減去當前句的開始時間
        const nextSentence = allSentences[currentIndex + 1];
        localDuration = nextSentence.startTime - item.startTime;
      }

      // 確保時間長度不為負數
      if (localDuration > 0) {
        highlightDuration += localDuration;
      }
    }

    return highlightDuration;
  }
}
