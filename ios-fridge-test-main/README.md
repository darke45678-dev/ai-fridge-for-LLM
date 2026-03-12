# AI 智慧廚房 (AI Fridge & Kitchen Brain)

這是一個結合 YOLOv8 即時物件辨識與 Gemini AI 食譜合成的智慧廚房管理助手。

## 📖 快速開始
關於如何在您的電腦上部署、安裝環境、以及啟動測試，請參考詳細的：
👉 **[專案部署與運行指南 (Project_Deployment_Guide.md)](./Project_Deployment_Guide.md)**

## 🚀 核心功能
*   **AI 即時掃描**：自動識別食材品種與品質（新鮮/過期）。
*   **智慧庫存管理**：自動追蹤入庫時間，提供過期預警。
*   **AI 廚房大腦**：一鍵根據現有食材合成創意食譜。
*   **食物浪費統計**：視覺化追蹤家庭食物減廢協議進度。

## 🛠️ 開發架構
*   **Frontend**: React, Vite, TailwindCSS, Framer Motion
*   **Backend**: FastAPI, YOLOv8, Google Gemini API