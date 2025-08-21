import type { AIProcessResult, TranscriptSentence, TranscriptSection, MockAPIResponse } from '../types';

// 模擬的轉錄文本數據
const MOCK_TRANSCRIPT_DATA = [
  {
    section: "開場介紹",
    sentences: [
      { text: "歡迎大家來到今天的技術分享會。", startTime: 0, endTime: 3.5, isHighlight: true },
      { text: "今天我們要討論的主題是人工智能在現代軟體開發中的應用。", startTime: 3.5, endTime: 8.2, isHighlight: false },
      { text: "這個話題對於每個開發者來說都非常重要。", startTime: 8.2, endTime: 12.1, isHighlight: true },
      { text: "讓我們從基礎概念開始談起。", startTime: 12.1, endTime: 15.3, isHighlight: false }
    ]
  },
  {
    section: "AI 技術概述",
    sentences: [
      { text: "人工智能不再只是科幻電影中的概念。", startTime: 15.3, endTime: 19.7, isHighlight: true },
      { text: "它已經深入到我們日常開發工作的各個方面。", startTime: 19.7, endTime: 24.2, isHighlight: false },
      { text: "從代碼自動完成到智能測試，AI 正在改變遊戲規則。", startTime: 24.2, endTime: 29.8, isHighlight: true },
      { text: "讓我們看看一些具體的應用案例。", startTime: 29.8, endTime: 33.5, isHighlight: false },
      { text: "GitHub Copilot 是一個很好的例子。", startTime: 33.5, endTime: 37.1, isHighlight: false },
      { text: "它能夠理解上下文並生成相關的代碼片段。", startTime: 37.1, endTime: 41.9, isHighlight: true }
    ]
  },
  {
    section: "實際應用場景",
    sentences: [
      { text: "在實際項目中，我們可以用 AI 來做什麼？", startTime: 41.9, endTime: 46.3, isHighlight: true },
      { text: "首先，代碼審查可以變得更加智能化。", startTime: 46.3, endTime: 50.7, isHighlight: false },
      { text: "AI 可以檢測潛在的安全漏洞和性能問題。", startTime: 50.7, endTime: 55.8, isHighlight: true },
      { text: "其次，自動化測試的編寫也變得更加容易。", startTime: 55.8, endTime: 60.4, isHighlight: false },
      { text: "AI 能夠分析代碼邏輯並生成對應的測試案例。", startTime: 60.4, endTime: 65.9, isHighlight: true },
      { text: "這大大提高了開發效率和代碼品質。", startTime: 65.9, endTime: 70.2, isHighlight: true }
    ]
  },
  {
    section: "未來展望",
    sentences: [
      { text: "那麼 AI 技術的未來會如何發展呢？", startTime: 70.2, endTime: 74.6, isHighlight: false },
      { text: "我認為會有更多個人化的開發助手出現。", startTime: 74.6, endTime: 79.3, isHighlight: true },
      { text: "這些助手能夠學習你的編程風格和習慣。", startTime: 79.3, endTime: 84.1, isHighlight: false },
      { text: "最終實現真正意義上的智能結對編程。", startTime: 84.1, endTime: 88.7, isHighlight: true },
      { text: "但我們也要注意不要過度依賴 AI。", startTime: 88.7, endTime: 92.9, isHighlight: false },
      { text: "保持對基礎知識的掌握仍然是最重要的。", startTime: 92.9, endTime: 97.5, isHighlight: true }
    ]
  },
  {
    section: "結語",
    sentences: [
      { text: "今天的分享就到這裡。", startTime: 97.5, endTime: 100.2, isHighlight: false },
      { text: "希望大家都能在 AI 的幫助下成為更好的開發者。", startTime: 100.2, endTime: 105.8, isHighlight: true },
      { text: "如果有任何問題，歡迎隨時與我交流。", startTime: 105.8, endTime: 110.4, isHighlight: false },
      { text: "感謝大家的聆聽！", startTime: 110.4, endTime: 113.0, isHighlight: true }
    ]
  }
];

// 生成隨機的處理時間（模擬 AI 處理）
const generateProcessingTime = (): number => {
  return Math.random() * 3000 + 2000; // 2-5秒
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
      isSelected: sentence.isHighlight // 預設選中建議的高亮句子
    }));

    const section: TranscriptSection = {
      id: `section_${sectionIndex}`,
      title: sectionData.section,
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
    totalDuration: sections[sections.length - 1].endTime,
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
      console.log('🤖 Mock AI: 開始處理影片...', videoFile.name);
      
      // 模擬處理進度
      if (onProgress) {
        const progressInterval = setInterval(() => {
          const currentProgress = Math.random() * 20 + 10; // 10-30% 隨機進度
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

      // 生成模擬結果
      const result = convertToAPIFormat(videoFile);
      
      console.log('✅ Mock AI: 處理完成', {
        sections: result.sections.length,
        totalSentences: result.sections.reduce((acc, section) => acc + section.sentences.length, 0),
        highlightCount: result.sections.reduce((acc, section) => 
          acc + section.sentences.filter(s => s.isHighlight).length, 0
        ),
        duration: result.totalDuration
      });

      return {
        success: true,
        data: result,
        message: '影片處理成功！已生成轉錄文本和高亮建議。'
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
   * 更新句子選擇狀態
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
   * 獲取選中的句子列表
   */
  static getSelectedSentences(result: AIProcessResult): TranscriptSentence[] {
    return result.sections
      .flatMap(section => section.sentences)
      .filter(sentence => sentence.isSelected)
      .sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * 計算高亮片段的總時長
   */
  static calculateHighlightDuration(result: AIProcessResult): number {
    const selectedSentences = this.getSelectedSentences(result);
    return selectedSentences.reduce((total, sentence) => 
      total + (sentence.endTime - sentence.startTime), 0
    );
  }
}
