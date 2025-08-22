# Video Highlight Tool

一個基於 React + TypeScript 的智能影片精華剪輯工具，能夠自動分析影片內容並生成精華片段建議。

## 🎯 專案概述

Video Highlight Tool 是一個 SPA (Single Page Application)，提供直觀的影片上傳、AI 分析和精華剪輯功能。使用者可以上傳影片後，系統會模擬 AI 處理，生成轉錄文本和精華片段建議，使用者可以自由編輯選擇要保留的片段。

## ✨ 當前功能

### 核心功能
- **影片上傳**: 支援本地影片檔案上傳
- **AI 模擬處理**: 模擬 AI 分析影片內容，生成轉錄文本
- **精華片段建議**: 自動標記建議的精華片段
- **即時預覽**: 雙面板設計，左側編輯右側預覽
- **時間軸同步**: EditingArea 與 PreviewArea 的播放時間完全同步
- **片段選擇**: 可自由選擇/取消選擇精華片段
- **時間戳跳轉**: 點擊時間戳直接跳轉到對應影片位置

### 使用者介面
- **響應式設計**: 支援桌面版和行動版瀏覽
- **現代化 UI**: 使用 Tailwind CSS 打造簡潔美觀的介面
- **直觀操作**: 拖放上傳、進度提示、錯誤處理

## 🚀 技術架構

### 前端技術棧
- **React 19**: 最新版本的 React 框架
- **TypeScript**: 完整的型別安全
- **Vite**: 現代化的建構工具
- **Tailwind CSS**: 實用優先的 CSS 框架
- **Lucide React**: 輕量化圖標庫

### 專案結構
```
src/
├── components/           # React 元件
│   ├── VideoUpload/     # 影片上傳元件
│   ├── EditingArea/     # 編輯區域（左側面板）
│   ├── PreviewArea/     # 預覽區域（右側面板）
│   └── Main/            # 主要元件（狀態管理中心）
├── services/            # 服務層
│   └── mockAI.ts       # 模擬 AI 處理服務
├── types/              # TypeScript 型別定義
└── utils/              # 工具函數
```

## 🎬 測試影片建議

為了獲得最佳體驗，建議使用以下測試影片：
**[測試影片集合](https://drive.google.com/drive/folders/1-OBLjAjAXidHmr313qKh7_r6E5_vbNyL)**

這些影片已經預先配置了模擬的轉錄數據，能夠展示完s整的功能流程。

## 🌐 線上 Demo

專案已部署至 GitHub Pages：
**[https://chiuweichung.github.io/video-highlight-tool/](https://chiuweichung.github.io/video-highlight-tool/)**

## 📋 開發流程與設計決策

### 開發方法論
我們採用以下開發流程來實現功能需求：

1. **AI 協助任務拆解**: 使用 AI 將複雜功能需求拆解為具體的開發任務
2. **快速原型開發**: 實現 → 測試 → 人工介入 → 優化 → 部署
3. **簡單優先原則**: 先把輪子造起來，暫時避免使用太多複雜的技術套件

### 架構設計原則

#### 1. 統一狀態管理
為了同步 EditingArea 與 PreviewArea 的時間軸，`currentTime` 在 Main Component 統一管理。這確保了兩個面板之間的播放進度完全一致。

#### 2. 保持簡單性
- **無路由需求**: 由於是單頁應用且功能相對集中，沒有使用 React Router
- **避免過度抽象**: 專案規模較小，維持程式碼邏輯簡單，沒有寫 customized hooks 來進行複雜的 props 共享
- **最小依賴**: 只使用必要的第三方套件，降低專案複雜度

#### 3. 模塊化元件設計
- **單一職責**: 每個元件負責特定功能
- **清晰介面**: 透過 TypeScript 定義明確的 props 介面
- **可重用性**: 元件設計考慮未來的擴展性

### 技術選型說明

#### 為什麼選擇 Native Video Element？
在這個專案裡我直接用瀏覽器原生的 `<video>` 元素，而不是額外裝一個播放器套件。主要原因很單純：原生就已經能滿足需求，操作上也更輕量，沒有多餘的依賴。對一個 MVP 來說，**最重要的是簡單、好維護，而不是一開始就把技術堆到很高**。用原生元件就能做到播放控制，還能確保相容性，正好符合這個階段的需求。

> 如果後續需要支援不同的影片來源（如 YouTube、Vimeo、Facebook），建議採用 `react-player` 套件，它提供了統一的 API 來處理多種影片來源。

## 額外實現的 Bonus 功能

## 1. Highlight 導航功能

**功能說明**
- **前進/後退按鈕**：在播放器控制區快速跳轉到上一個/下一個精華片段  
- **片段跳轉**：自動移動到所選精華片段的起始時間  
- **邊界處理**：在第一個/最後一個片段時，提供智能處理邏輯  

**技術實現**
- 在 `PreviewArea` 實作 `getNextSentence()` 與 `getPreviousSentence()`  
- 透過 `playerRef.current.currentTime` 控制播放位置  
- 按鈕狀態自動管理，未選取片段時會禁用  

---

## 2. 跟隨播放選項功能

**功能說明**
- **跟隨播放切換**：在 `EditingArea` 標題欄加入 checkbox，使用者可自由選擇  
- **自動滾動**：啟用後，字幕會自動對應到當前播放位置  
- **自動片段跳躍**：播放時自動跳過未選取的片段，只播放精華  

**技術實現**
- **UI 控制**：  
  - 在 `EditingArea` 新增「跟隨播放」checkbox (`autoFollow`)  
  - 使用 `useState(true)` 設定預設啟用  
  - 狀態透過 `setAutoFollow(e.target.checked)` 更新  
  - 搭配片段統計資訊（已選擇 X 句 / 共 Y 句）顯示  

- **自動跟隨邏輯**：  
  - 使用 `useEffect` 監聽 `autoFollow` 與 `currentSentence`  
  - 當啟用時，自動滾動到對應字幕位置  
  - 使用 `sentenceRefs` + `scrollTo` 實現平滑滾動  
  - 透過 `lastScrolledIdRef` 避免重複滾動  

**開發插曲**  
在開發跟隨播放的功能時，其實有遇到一個小插曲。最一開始我是用 `scrollIntoView` 來實現自動滾動，雖然功能能動，但效果卻太突兀，畫面會突然跳動，讓整個閱讀體驗變得不太順暢。後來改用 `scrollTo`，並加上平滑滾動參數，整體效果就自然許多，也讓字幕跟隨的功能更貼近使用者的使用習慣。
