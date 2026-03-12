# 🍳 AI 智慧廚房 | 部署與運行指南

這是一份幫助您快速部署並啟動「AI 智慧廚房」應用的完整教學。

---

## 🛠️ 環境需求

| 工具 | 版本 | 用途 |
11: | **Node.js** | v22 以上 | 執行前端 + Capacitor CLI |
13: | **Git** | 最新版 | 同步代碼與部署 |

---

## 🚀 部署步驟

### 1. 下載專案
```bash
git clone https://github.com/darke45678-dev/ios-fridge-test.git
cd ios-fridge-test
```

### 2. 環境設定
```bash
npm install
```

### 3. 設定 API 金鑰 (用於 AI 食譜生成)
建立 `.env` 文件並填入您的 Gemini API 金鑰：
```env
VITE_LLM_API_KEY=您的_GEMINI_API_金鑰
```

---

## 🖥️ 啟動應用程式

### 本機開發模式
```bash
npm run dev
# 瀏覽 http://localhost:5173
```

### 網頁端部署 (GitHub Pages)
```bash
npm run deploy
```

---

## 📱 iOS App 更新流程

修改代碼後，推送到 `main` 分支即可觸發 GitHub Actions 自動編譯：

```bash
git add .
git commit -m "update layout"
git push origin main
```

前往 [GitHub Actions](https://github.com/darke45678-dev/ios-fridge-test/actions) 下載最新的 `IPA` 套件。

---

## 📝 開發者提示

| 功能 | 說明 |
|---|---|
| 修改 UI 頁面 | 主要邏輯位於 `src/app/pages/Views.tsx` |
| 更換 AI 模型 | 將新模型取名為 `best.onnx` 放入 `public/` 目錄 |
| 調整辨識閾值 | 可在單機版的「個人設定」頁面中動態調整靈敏度 |

---
祝開發順利！
