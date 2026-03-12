# 🚀 KITCHEN AI：跨電腦接續工作指南

這份指南將告訴你如何在另一台電腦上快速啟動這個專案，並接續之前的 AI 辨識開發工作。

## 📋 準備環境 (新電腦只需做一次)

1.  **安裝 Node.js**：[點此下載](https://nodejs.org/) (建議選擇 LTS 版本)。
2.  **安裝 Git**：[點此下載](https://git-scm.com/) (用於上傳網站)。

## 🛠️ 第一步：啟動開發環境

當你把專案資料夾下載並解壓縮後，請打開終端機 (或 PowerShell)，並執行以下指令：

```powershell
# 1. 進入專案目錄 (假設資料夾叫 AI-fridge-IOS-main)
cd AI-fridge-IOS-main

# 2. 安裝所有必要的零件
npm install

# 3. 啟動本機開發模式
npm run dev
```

執行完後，終端機會給你一個網址（例如 `http://localhost:5173`），點開它就能在電腦上測試 UI。

## 🤖 AI 核心說明

目前我們已經完成「AI 大腦 (ONNX)」的串接：
- **無需安裝 Python**：辨識引擎已經整合在網頁端，透過 CDN 自動下載核心運算零件。
- **本地運作**：AI 推理會在瀏覽器端本地執行，不會消耗雲端流量。

## 🚀 第二步：如何將最新修改上傳到測試網址

如果你修改了代碼，想要讓手機網址同步更新，請執行以下「一鍵部署」指令：

```powershell
# 將修改後的內容打包並推送到 GitHub Pages
npm run deploy
```

> [!TIP]
> 如果你的 Git 沒有設定好路徑，請確保執行：
> `$env:PATH += ";C:\Program Files\Git\bin"` (Windows 適用)

## 📁 資料夾結構快速導覽
- `src/app/components/scanner/CameraView.tsx`：這是 **AI 的靈魂**，控制這如何載入模型與解析食材。
- `public/best.onnx`：這是 **AI 的大腦**，所有的訓練成果都在這 44MB 的檔案裡。
- `vite.config.ts`：如果你更改了 GitHub 倉庫名稱，記得修改這裡的 `base` 路徑。

---
**現在，你可以在任何地方接續這場 AI 廚房開發了！🍴**
