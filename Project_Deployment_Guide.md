# 🍳 AI 智慧廚房：專案部署與運行指南

這是一份幫助您在全新電腦環境中快速部署並啟動「AI 智慧廚房」APP 的完整教學。

---

## 🛠️ 環境準備 (Requirements)

在開始之前，請確保您的電腦已安裝以下基礎環境：

1.  **Node.js**: 建議版本 `18.0.0` 或以上（用於執行前端網頁介面）。
2.  **Python**: 建議版本 `3.9` ~ `3.11`（用於執行 AI 辨識後端 API）。
3.  **Git**: 用於下載專案原始碼。

---

## 🚀 部署步驟

### 1. 下載專案
```bash
git clone https://github.com/darke45678-dev/AI_fridge-2.git
cd AI_fridge-2
```

### 2. 後端環境設定 (Python API)
首先，安裝後端 AI 辨識所需的套件：
```bash
# 建議先建立虛擬環境 (選配)
# python -m venv venv
# venv\Scripts\activate

# 安裝核心套件
pip install fastapi uvicorn ultralytics pillow python-dotenv google-genai requests
```
*   **關鍵檔案**：請確保目錄下存有 `best.pt` (AI 模型檔)。

### 3. 前端環境設定 (React/Vite)
安裝網頁前端所需的依賴套件：
```bash
npm install
```

### 4. 設定 API 金鑰 (Environmental Variables)
本專案的食譜生成功能需要 Google Gemini API。
1.  在根目錄尋找 `.env.example` 並將其重新命名為 `.env`。
2.  開啟 `.env`，填入您的金鑰：
    ```env
    GEMINI_API_KEY=您的_GEMINI_API_金鑰 (後端生成食譜使用)
    VITE_LLM_API_KEY=您的_GEMINI_API_金鑰 (前端呼叫使用)
    VITE_DETECTION_API_URL=http://localhost:8000
    ```

---

## 🖥️ 啟動應用程式

您需要同時開啟兩個終端機視窗來分別運行前後端：

### 視窗 A：啟動後端辨識伺服器
```bash
python api.py
```
*   運行成功後會顯示：`INFO: Uvicorn running on http://0.0.0.0:8000`

### 視窗 B：啟動前端網頁
```bash
npm run dev
```
*   運行後會提供一個本地網址，通常是：`http://localhost:5173`

---

## 🧪 啟動本地測試 (Testing)

為了確保 AI 模型與 API 運作正常，您可以執行自動化測試腳本：

1.  確保後端 (`api.py`) 正在運行。
2.  開啟新終端機執行：
    ```bash
    python run_system_tests.py
    ```
*   **成功指標**：如果看到 `All system tests passed! ✅`，代表您的環境已經完全支援所有 AI 功能。

---

## 📝 開發者筆記 (Developer Tips)
*   **掃描不到？**：請檢查 `src/app/components/scanner/CameraView.tsx` 裡面的 `CONFIDENCE_THRESHOLD` (信心度門檻)，建議設定在 `0.2` 左右。
*   **前端修改**：所有的 UI 邏輯都在 `src/app/pages/Views.tsx` 以及 `src/app/components/` 路徑下。
*   **模型更新**：若要更換更強的模型，直接取名為 `best.pt` 替換根目錄下的檔案即可。

---
祝福您的 AI 廚房開發順利！如果有任何環境安裝問題，請隨時詢問。
