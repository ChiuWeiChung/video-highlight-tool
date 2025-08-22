# Video Highlight Tool

一個基於 React + TypeScript 的 AI 影片精華剪輯工具，能夠自動分析影片內容並生成精華片段建議。



## 🌐 線上 Demo

### **測試影片建議**
我在雲端空間準備了影片，方便 user 進行測試： [大谷翔平 50/50](https://drive.google.com/file/d/1CeRLI6ODufrLF3v7FOf2eemAB1acBYjE/view?usp=drive_link)  

該影片可直接搭配程式碼中的 [mockData](./public/mockTranscriptData.json)，已預先配置轉錄數據，可立即展示完整功能流程。

專案已部署至 GitHub Pages：
**[https://chiuweichung.github.io/video-highlight-tool/](https://chiuweichung.github.io/video-highlight-tool/)**

![DEMO 動畫](docs/5050demo.gif)

## 使用的技術

在這個專案中，由於目前規模不大，因此我刻意讓架構保持單純一點，不需要的東西就不額外引入。
例如，因為專案沒有路由需求，所以沒有使用 React Router。

- 框架：**React 19**
- 語言：**TypeScript**
- Build Tool：**Vite**
- CSS Solution：**Tailwind CSS**
- 其他：**Lucide React** (Icon Library)

## 實現的功能

### 1 編輯區 (左側)
- [x] 顯示逐字稿內容
- [x] 支援段落標題顯示
- [x] 顯示字幕與時間戳
- [x] 使用者可勾選或取消勾選字幕作為精華片段
- [x] 時間戳可點擊，快速導向對應片段
- [x] 支援自動捲動，跟隨預覽播放進度

### 2 預覽區 (右側)
- [x] 顯示編輯後的精華片段（非原始完整影片）
- [x] 影片播放器：支援播放、暫停、快轉等標準控制
- [x] 將已選取的逐字稿文字疊加顯示於影片上
- [x] 時間軸顯示精華片段
- [ ] 片段間播放支援平滑轉場效果 

> 關於平滑轉場效果，目前還不確定是否該透過 CSS 來實現。我有嘗試過用 CSS 特效來模擬，但實際呈現效果並不理想，所以暫時先將這個功能移除。

> 另外，我也想補充一個觀察：如果單純依靠 CSS 來處理段落之間的轉場，效果其實只會體現在網頁播放時，並不會真正改變影片本身的內容。若未來需要支援「輸出影片」功能，這部分可能還是得在生成階段由 AI 直接內嵌，否則輸出的影片就無法保留這些效果。目前這一塊還在思考和研究當中，之後會再評估更合適的做法。。

### 3 同步功能
- **編輯區 → 預覽區**
  - [x] 點擊時間戳可更新預覽影片至該時間點
  - [x] 勾選或取消字幕會即時更新預覽內容

- **預覽區 → 編輯區**
  - [x] 播放時，編輯區會自動 highlight 顯示當前播放中的字幕
  - [x] 編輯區自動捲動，確保當前字幕保持可見

### 4 字幕顯示疊層
- [x] 已選取的字幕會顯示為影片上的文字疊加
- [x] 文字的顯示時間與對應語音內容保持同步

### 專案結構
```
src/
├── components/           # React 元件
│   ├── VideoUpload/     # 影片上傳元件
│   ├── EditingArea/     # 編輯元件（左側面板）
│   ├── PreviewArea/     # 預覽元件（右側面板）
│   └── Main/            # 主要元件（狀態管理中心）
│
├── services/            # Mock API 服務
│   └── mockAI.ts       # 模擬 AI 處理服務以及提供相關操作 methods
│
├── types/              # 型別定義
│
└── utils/              # 工具函數
```

## 📋 開發流程與設計決策

### 開發方法論

在這個專案中，我主要透過 Cursor 搭配 AI 來輔助開發。流程上，我會先提供完整的需求與規格，讓 AI 把複雜功能拆解成清楚的任務，再逐步完成實作。整個過程以快速原型為核心，從開發、測試到人工調整，再持續優化與部署。

同時，我也刻意維持「簡單優先」的原則：先把核心功能跑起來，避免一開始就堆太多套件或設計，導致過度複雜。


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


## 額外實現的 Bonus 功能

### 1. Highlight 導航功能 (前進 & 後退)

**功能說明**
- **前進/後退按鈕**：在播放器控制區快速跳轉到上一個/下一個精華片段  
- **片段跳轉**：自動移動到所選精華片段的起始時間

**技術實現**
- 在 `PreviewArea` 實作 `getNextSentence()` 與 `getPreviousSentence()`  
- 透過 `playerRef.current.currentTime` 控制播放位置

---

### 2. 跟隨播放選項功能

**功能說明**
- **跟隨播放切換**：在 `EditingArea` 標題欄加入 checkbox，使用者可自由選擇

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

## 開發後的想法

### 關於 Video Player

在這個專案裡，我一開始選擇直接用瀏覽器原生的 `<video>` 元素來做播放器，因為對 MVP 來說，原生功能已經夠用，又好維護。

不過在開發過程中也想到，如果未來要支援 YouTube、Vimeo 等線上影音來源，單靠原生 `<video>` 就不行了。這時可以改採用 react-player，它在新版（v3）已經把 API 設計得很接近原生 `<video>` 的用法，因此在切換或擴充支援時，幾乎不需要大幅改動程式碼。也就是說，先用原生確保專案簡單好上手，未來要支援更多來源時，再平順地過渡到 react-player。

> 以前在研究 HLS 串流的時候就有接觸過 react-player，所以這次也順便把相關想法記錄下來。
