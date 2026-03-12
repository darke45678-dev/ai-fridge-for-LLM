# 🍳 AI 智慧廚房：專案部署與運行指南

這是一份幫助您在全新電腦環境中快速部署並啟動「AI 智慧廚房」APP 的完整教學。

---

## 🛠️ 環境需求

| 工具 | 版本 | 用途 |
|---|---|---|
| **Node.js** | v22 以上 | 執行前端 + Capacitor CLI（強制需求） |
| **Python** | 3.9 - 3.11 | 執行 AI 辨識後端 API（可選） |
| **Git** | 最新版 | 同步代碼 |

---

## 🚀 部署步驟

### 1. 下載專案
```bash
git clone https://github.com/darke45678-dev/ios-fridge-test.git
cd ios-fridge-test
```

### 2. 前端環境設定
```bash
npm install
```

### 3. 後端環境設定（可選，用於伺服器端 AI 辨識）
```bash
pip install fastapi uvicorn ultralytics pillow python-dotenv google-genai requests
```
> 需確保目錄下存有 `best.pt` (AI 模型檔，需手動放置)

### 4. 設定 API 金鑰
```bash
# 複製範本並填入金鑰
cp .env.example .env
```

開啟 `.env` 填入：
```env
GEMINI_API_KEY=您的_GEMINI_API_金鑰
VITE_LLM_API_KEY=您的_GEMINI_API_金鑰
VITE_DETECTION_API_URL=http://localhost:8000
```

---

## 🖥️ 啟動應用程式

### 僅前端（日常開發用）
```bash
npm run dev
# 開啟 http://localhost:5173
```

### 前端 + 後端（完整功能）
```bash
# 視窗 A：啟動後端
python api.py
# 成功後顯示：INFO: Uvicorn running on http://0.0.0.0:8000

# 視窗 B：啟動前端
npm run dev
```

---

## 🧪 執行系統測試

確保後端 `api.py` 正在運行後：

```bash
python run_system_tests.py
```

成功指標：出現 `All system tests passed! ✅`

---

## 📱 iOS App 更新流程

修改代碼後，推送即可觸發雲端自動打包：

```bash
git add .
git commit -m "你的修改說明"
git push origin main
```

然後到 [GitHub Actions](https://github.com/darke45678-dev/ios-fridge-test/actions) 下載最新的 `KitchenAI-iOS-Standalone-IPA`。
詳細安裝步驟請見 **`README_IOS.md`**。

---

## 📝 開發者提示

| 提示 | 說明 |
|---|---|
| 掃描不到食材 | 調整 `CameraView.tsx` 裡的 `CONFIDENCE_THRESHOLD`（建議 `0.2`） |
| 修改 UI | 所有頁面邏輯在 `src/app/pages/Views.tsx` |
| 更換 AI 模型 | 將新模型取名 `best.onnx` 放入 `public/` 目錄即可 |
| 更換 GitHub 倉庫 | 記得修改 `vite.config.ts` 中的 `base` 路徑 |

---
祝福您的 AI 廚房開發順利！如果有任何問題，請隨時詢問。
