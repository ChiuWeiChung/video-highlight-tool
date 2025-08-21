import type { AIProcessResult, TranscriptSentence, TranscriptSection, MockAPIResponse } from '../types';
import { MOCK_TRANSCRIPT_DATA } from './mockTranscriptData';

// 生成隨機的處理時間（模擬 AI 處理）
const generateProcessingTime = (): number => {
  return 1000; // 1 秒
};

// 生成唯一 ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 將模擬數據轉換為 API 格式
const convertToAPIFormat = (videoFile: File): AIProcessResult => {
  const videoId = generateId();
  const sections: TranscriptSection[] = [];
  let sentenceIdCounter = 0;

  MOCK_TRANSCRIPT_DATA.forEach((sectionData, sectionIndex) => {
    const sentences: TranscriptSentence[] = sectionData.sentences.map((sentence, sentenceIndex) => ({
      id: `sentence_${sentenceIdCounter++}`,
      text: sentence.text,
      startTime: sentence.startTime,
      endTime: sentence.endTime,
      isHighlight: sentence.isHighlight,
      isSelected: sentence.isHighlight // 預設選中建議的 Highlight 字幕
    }));

    const section: TranscriptSection = {
      id: `section_${sectionIndex}`,
      title: sectionData.title,
      startTime: sentences[0].startTime,
      endTime: sentences[sentences.length - 1].endTime,
      sentences
    };

    sections.push(section);
  });

  // 生成完整轉錄文本
  const fullTranscript = sections
    .map(section => 
      section.sentences
        .map(sentence => sentence.text)
        .join(' ')
    )
    .join(' ');

  return {
    videoId,
    fullTranscript,
    sections,
    totalDuration: sections[sections.length - 1].endTime, // Bug: 非總時長，而是最後一個片段的結束時間 
    processingTime: generateProcessingTime()
  };
};

// 模擬 AI 處理延遲
const simulateProcessingDelay = (duration: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, duration));
};

// Mock AI API 服務
export class MockAIService {
  /**
   * 模擬 AI 處理影片並返回轉錄文本
   */
  static async processVideo(
    videoFile: File,
    onProgress?: (progress: number) => void
  ): Promise<MockAPIResponse<AIProcessResult>> {
    try {
      // console.log('🤖 Mock AI: 開始處理影片...', videoFile.name);
      
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
      } else {
        await simulateProcessingDelay(generateProcessingTime());
      }

      // TODO: 取得結果需要是 json 格式!
      // 生成模擬結果
      const result = convertToAPIFormat(videoFile);
      
      // console.log('✅ Mock AI: 處理完成', {
      //   sections: result.sections.length,
      //   totalSentences: result.sections.reduce((acc, section) => acc + section.sentences.length, 0),
      //   highlightCount: result.sections.reduce((acc, section) => 
      //     acc + section.sentences.filter(s => s.isHighlight).length, 0
      //   ),
      //   duration: result.totalDuration
      // });

      return {
        success: true,
        data: result,
        message: '影片處理成功！已生成轉錄文本和Highlight建議。'
      };

    } catch (error) {
      console.error('❌ Mock AI: 處理失敗', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤',
        message: '影片處理失敗，請重試。'
      };
    }
  }

  /**
   * 更新字幕選擇狀態
   */
  static updateSentenceSelection(
    result: AIProcessResult,
    sentenceId: string,
    isSelected: boolean
  ): AIProcessResult {
    const updatedSections = result.sections.map(section => ({
      ...section,
      sentences: section.sentences.map(sentence =>
        sentence.id === sentenceId
          ? { ...sentence, isSelected }
          : sentence
      )
    }));

    return {
      ...result,
      sections: updatedSections
    };
  }

  /**
   * 獲取選中的字幕列表
   */
  static getSelectedSentences(result: AIProcessResult): TranscriptSentence[] {
    return result.sections
      .flatMap(section => section.sentences)
      .filter(sentence => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 計算Highlight片段的總時長
   */
  static calculateHighlightDuration(result: AIProcessResult): number {
    const selectedSentences = this.getSelectedSentences(result);
    return selectedSentences.reduce((total, sentence) => 
      total + (sentence.endTime - sentence.startTime), 0
    );
  }
}
