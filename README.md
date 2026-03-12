# 🍳 AI 智慧廚房 | Kitchen AI (Culinary Intelligence)

這是專為 AI 整合與行動端高效體驗優化的冰箱管理系統。採用賽博龐克視覺風格，整合本地 ONNX 神經網路與智慧食譜生成。

## 📖 快速開始
關於如何在您的電腦上部署、安裝環境、以及啟動測試，請參考詳細的：
👉 **[專案部署與運行指南 (Project_Deployment_Guide.md)](./Project_Deployment_Guide.md)**

## 🚀 核心優化功能
*   **Neural Vision (本地 AI)**：整合 YOLOv8 ONNX 模型，在瀏覽器端即可執行即時食材與新鮮度辨識。
*   **智慧分頁 UI**：針對行動載具優化的「分類標籤」與「統計趨勢」分頁導覽系統。
*   **數據持久化**：所有庫存紀錄、收藏食譜與食物浪費統計皆透過 `localStorage` 實現離線持久化儲存。
*   **AI 減廢協議**：視覺化追蹤食材損耗紀錄，根據效期自動排列優先處理計畫。
*   **食譜合成器**：基於庫存食材一鍵推論創意料理，支援食譜收藏與烹調導引。

## 🛠️ 開發架構
*   **Frontend**: React 18, Vite 7, TailwindCSS, Framer Motion
*   **AI Engine**: ONNX Runtime Web (WASM/WebGL)
*   **Deployment**: GitHub Actions (iOS IPA Auto-Build), GitHub Pages (Web)