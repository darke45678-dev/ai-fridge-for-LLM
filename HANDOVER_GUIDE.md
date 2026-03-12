# 🚀 KITCHEN AI：跨電腦接續工作指南

這份指南告訴你如何在任何電腦上快速啟動這個專案，並接續 AI 辨識開發工作。

---

## 📋 環境需求 (新電腦只需做一次)

| 工具 | 版本 | 用途 |
|---|---|---|
| **Node.js** | v22 以上 | 執行前端網頁介面 + Capacitor CLI |
| **Python** | 3.9 - 3.11 | 執行 AI 辨識後端 API（可選） |
| **Git** | 最新版 | 同步代碼到 GitHub |

👉 [下載 Node.js](https://nodejs.org/) | [下載 Git](https://git-scm.com/)

---

## 🛠️ 第一步：啟動開發環境

下載並解壓縮專案後，打開終端機 (PowerShell)：

```powershell
# 進入專案目錄
cd ios-fridge-test-main

# 安裝所有必要的套件
npm install

# 啟動本機開發模式
npm run dev
```

執行完後，終端機會給你一個網址（例如 `http://localhost:5173`），點開即可在電腦上測試 UI。

---

## 🤖 AI 核心說明

### 食材辨識 (ONNX 本地推理)
- **無需安裝 Python**：辨識引擎整合在網頁端，透過 CDN 載入核心運算零件
- **本地運作**：AI 推理在瀏覽器端本地執行，不消耗雲端流量
- **模型檔案**：`public/best.onnx` (約 44MB，YOLOv8 轉換而成)

### 食譜生成 (Google Gemini API)
- 需要在 `.env` 設定 `VITE_LLM_API_KEY`
- 複製 `.env.example` 並重新命名為 `.env`，填入您的 Gemini API 金鑰

---

## 🚀 第二步：如何更新到測試網址 (GitHub Pages)

修改代碼後執行以下「一鍵部署」：

```powershell
# 打包並推送到 GitHub Pages
npm run deploy
```

> [!TIP]
> 如果 Git 路徑未設定，請先執行：
> `$env:PATH += ";C:\Program Files\Git\bin"` (Windows 適用)

---

## 📱 第三步：如何更新 iOS App

修改代碼後，推送到 GitHub，雲端會自動重新編譯 `.ipa`：

```powershell
git add .
git commit -m "你的修改說明"
git push origin main
```

然後到 [GitHub Actions](https://github.com/darke45678-dev/ios-fridge-test/actions) 下載新的 `KitchenAI-iOS-Standalone-IPA`，再用 Sideloadly 覆蓋安裝。

詳細 iOS 安裝步驟請參考 **`README_IOS.md`**。

---

## 📁 資料夾結構快速導覽

| 路徑 | 說明 |
|---|---|
| `src/app/components/scanner/CameraView.tsx` | **AI 的靈魂**：控制如何載入模型與解析食材 |
| `public/best.onnx` | **AI 的大腦**：所有訓練成果 (44MB) |
| `src/app/pages/Views.tsx` | 所有頁面的 UI 邏輯 |
| `src/app/services/` | 後端 API 服務 (食譜、LLM) |
| `.github/workflows/build-ios.yml` | GitHub Actions iOS 自動打包腳本 |
| `vite.config.ts` | 如果更改了 GitHub 倉庫名稱，記得修改 `base` 路徑 |

---

## 🛑 常見問題排解

| 問題 | 解法 |
|---|---|
| 掃描不到食材 | 調低 `CameraView.tsx` 中的 `CONFIDENCE_THRESHOLD`（建議設 `0.2`） |
| 食譜生成無反應 | 確認 `.env` 中的 `VITE_LLM_API_KEY` 是否填寫正確 |
| iOS App 閃退 | 簽名效期已到（7天），重新用 Sideloadly 簽名即可 |
| Git push 失敗 | 執行 `$env:PATH += ";C:\Program Files\Git\bin"` |

---
**現在，你可以在任何地方接續這場 AI 廚房開發了！🍴**
