# 🚀 KITCHEN AI：跨電腦接續工作指南

這份指南將引導您如何在任何電腦上快速啟動專案，並接續 AI 視覺辨識與 UI 的開發工作。

---

## 📋 環境需求 (新電腦只需做一次)

| 工具 | 版本 | 用途 |
|---|---|---|
| **Node.js** | v22 以上 | 執行前端網頁介面 + Capacitor CLI |
| **Git** | 最新版 | 同步代碼與雲端部署 |

👉 [下載 Node.js](https://nodejs.org/) | [下載 Git](https://git-scm.com/)

---

## 🛠️ 第一步：啟動開發環境

```powershell
# 進入專案目錄
cd ios-fridge-test

# 安裝所有必要套件
npm install

# 啟動本機開發模式
npm run dev
```

---

## 🤖 AI 核心架構

### 食材辨識 (ONNX 本地推理)
- **純前端運作**：辨識引擎直接整合在瀏覽器中，無需安裝 Python 或啟動後端伺服器。
- **核心文件**：`src/app/components/scanner/CameraView.tsx` 負責處理影格並解析 YOLOv8 輸出。
- **模型檔案**：`public/best.onnx` (YOLOv8 導出的跨平台格式)。

### 食譜生成 (Gemini AI)
- 透過 `src/app/services/llmService.ts` 調用。
- 務必在 `.env` 中設定 `VITE_LLM_API_KEY`。

---

## 🚀 第二步：部署與更新

### 1. 更新 Web 測試版 (GitHub Pages)
```powershell
npm run deploy
```

### 2. 更新 iOS App (.ipa)
只需將變更推送到 GitHub，GitHub Actions 會自動編譯最新的 Standalone IPA：
```powershell
git add .
git commit -m "優化 UI 佈局"
git push origin main
```
編譯完成後，至 [GitHub Actions](https://github.com/darke45678-dev/ios-fridge-test/actions) 下載 `KitchenLite-iOS-Standalone-IPA`。

---

## 📁 核心架構導覽

| 路徑 | 說明 |
|---|---|
| `src/app/pages/Views.tsx` | **UI 中樞**：包含庫存、統計、個人中心的所有頁面邏輯 |
| `src/app/services/IngredientContext.tsx` | **數據大腦**：管理食材數量、浪費統計與本地持久化 |
| `src/app/components/` | 各個頁面使用的賽博龐克風格組件 |
| `.github/workflows/` | iOS 雲端自動打包腳本 |

---

## 🛑 開發常見問題

- **辨識太靈敏或太遲鈍**：在 App 的「個人設定」中調整「辨識靈敏度」。
- **數據錯誤**：可以點擊個人設定底部的「清空所有資料」進行重置。

---
**現在，您可以開始為這款 AI 加入更多酷炫的功能了！🍴**
