import io
import base64
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
# from ultralytics import YOLO (移至函數內載入以節省記憶體)
from PIL import Image
from dotenv import load_dotenv

load_dotenv()

# Initialize FastAPI
app = FastAPI(title="YOLOv8 Ingredient Detector API")

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Configuration ===
MODEL_PATH = 'yolov8n.pt' # 使用最輕量的模型檔案 (約 6MB) 以適應 Render 免費版記憶體
model = None

def load_model():
    """只有在需要時才載入模型，節省 Render 的啟動記憶體。"""
    global model
    if model is None:
        try:
            from ultralytics import YOLO # 移到這裡才引入，避免啟動時直接 OOM
            print(f"--- 正在嘗試從 {MODEL_PATH} 載入 AI 模型 ---")
            model = YOLO(MODEL_PATH)
            print("✅ 模型載入成功！")
        except Exception as e:
            print(f"❌ 載入失敗: {e}")
    return model

# === Mock Recipe Database ===
RECIPE_DB = {
    "tomato": {
        "name": "番茄炒蛋",
        "description": "經典家常菜，營養豐富且製作快速。",
        "steps": ["番茄切塊", "雞蛋打散", "熱鍋炒蛋", "加入番茄翻炒"],
        "matches": ["egg"]
    },
    "spinach": {
        "name": "蒜炒菠菜",
        "description": "簡單清脆的經典綠葉菜做法。",
        "steps": ["菠菜洗淨", "蒜末爆香", "大火快炒"],
        "matches": ["garlic"]
    }
}

class DetectionRequest(BaseModel):
    image: str  # Base64 encoded image string

@app.get("/")
def health_check():
    # 首頁不觸發模型載入，確保 Render 監控不會因為加載太久而判定失敗
    return {
        "status": "online", 
        "engine": "YOLOv8",
        "message": "AI Fridge Backend is running. Sensors active."
    }

@app.post("/detect")
async def detect(request: DetectionRequest):
    detector = load_model()
    if not detector:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # --- 圖像解碼與處理 (Image Decoding) ---
        encoded = request.image.split(",", 1)[1] if "," in request.image else request.image
        img_data = base64.b64decode(encoded)
        img = Image.open(io.BytesIO(img_data)).convert("RGB")
        
        # --- 執行模型辨識 (Run YOLO Inference) ---
        results = detector(img, verbose=False)
        
        # --- 解析偵測結果 (Parse Results) ---
        detections = []
        width, height = img.size
        
        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                name = detector.names[cls_id] # 取得類別名稱
                conf = float(box.conf[0]) # 取得信心度 (0~1)
                xyxy = box.xyxy[0].tolist() # 取得座標 [x1, y1, x2, y2]
                
                # --- 品質判定邏輯 (Spoiled Logic) ---
                # 如果標籤名稱包含 'rotten'，判定為損壞食材
                is_spoiled = (name.lower() == 'rotten')
                
                detections.append({
                    "name": name,
                    "confidence": conf,
                    "box": [
                        xyxy[0] / width, 
                        xyxy[1] / height, 
                        xyxy[2] / width, 
                        xyxy[3] / height
                    ],
                    "isSpoiled": is_spoiled,
                    # 分類邏輯：若是菠菜則分類為蔬菜，其餘預設為其他
                    "category": "蔬菜" if "spinach" in name.lower() else "其他"
                })
        
        # Build Summary
        bad_count = sum(1 for d in detections if d["isSpoiled"])
        good_count = len(detections) - bad_count
        
        # Group detections for local DB/recipes logic
        distinct_names = set(d["name"].lower() for d in detections if not d["isSpoiled"])
        recommended = []
        for name in distinct_names:
            if name in RECIPE_DB:
                recommended.append(RECIPE_DB[name])

        return {
            "detections": detections,
            "recipes": recommended,
            "summary": f"偵測完成：{good_count} 個良品, {bad_count} 個損壞。{len(recommended)} 個適用食譜已就緒。"
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/recommend-recipes")
async def recommend_recipes(ingredients: dict):
    # If the frontend sends a list, we should probably wrap it or change the signature
    # But for now, let's assume it's a dict or update it to handle the list properly.
    items = ingredients.get("ingredients", [])
    return [
        {
            "id": "rec_001",
            "name": "全能型食材濃湯",
            "match_score": 85,
            "description": "運用現有辨識食材合成的高營養湯品。",
            "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800",
            "time": "20 min"
        },
        {
            "id": "rec_002",
            "name": "感測器推薦：清炒食蔬",
            "match_score": 92,
            "description": "保留食材原始資料與口感的最佳烹飪協議。",
            "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800",
            "time": "15 min"
        }
    ]

from google import genai
import json

# === AI 服務安全介面 (Neural Link Protocol) ===
def call_ai_service(ingredients: list, api_key: str):
    """
    使用 Google GenAI SDK (新版) 生成食譜。
    """
    try:
        # 初始化新版 Client
        client = genai.Client(api_key=api_key)
        
        import time
        prompt = f"""
        [角色任務]
        你是一位冷靜、精準且高效的「直覺系主廚」。
        當前執行時間戳記: {time.time()} (請確保每次生成的創意組合都有所不同)
        
        [背景資訊]
        根據食材清單提供實用方案。
        食材清單: {', '.join(ingredients)}
        
        [具體指令]
        請嚴格生成 3 道料理且必須包裝在 JSON 數組中，結構如下：
        [
            {{
                "id": "chef_logic_1",
                "name": "[純粹類] 料理名稱",
                "matchScore": 95,
                "description": "食材速報：列出食材與比例。",
                "steps": [
                    {{"title": "準備", "description": "描述步驟"}},
                    {{"title": "執行", "description": "描述步驟"}}
                ],
                "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800",
                "time": "15 MIN",
                "difficulty": "EASY",
                "category": "vegetable",
                "requiredIngredients": ["食材1"]
            }}
        ]
        
        [約束條件]
        1. 每個料理必須包含 3-5 個 "steps"，每個 step 的 description 不超過 20 字。
        2. 禁止廢話：嚴禁情緒化助詞、寒暄或原理說明。
        3. 字數限制：總回覆 JSON 內容控制在 400 中文字內。
        4. 語言：繁體中文。
        5. 僅輸出 JSON 數據，不帶 Markdown 標記。
        """
        
        # 使用新版 SDK 呼叫
        response = client.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt
        )
        
        # 獲取回傳內容
        content = response.text.strip()
        
        # 清洗內容：使用正則表達式尋找 JSON 數組 (Robust extraction)
        import re
        json_match = re.search(r'\[.*\]', content, re.DOTALL)
        if json_match:
            content = json_match.group(0)
        
        return json.loads(content)
        
    except Exception as e:
        import traceback
        print("--- Gemini API Error Details ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Message: {str(e)}")
        traceback.print_exc()
        print("--------------------------------")
        return None

@app.post("/api/generate-recipe")
async def generate_recipe(data: dict):
    # 安全載入：從環境變數讀取 Gemini API 金鑰
    api_key = os.getenv('GEMINI_API_KEY') or os.getenv('VITE_LLM_API_KEY')
    
    # 錯誤處理：若金鑰缺失
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="系統環境配置錯誤 (Neural Link Authentication Failed)"
        )
    
    # 接收前端轉傳的「已勾選食材」
    selected_ingredients = data.get("selected_ingredients", [])
    
    if not selected_ingredients:
        raise HTTPException(status_code=400, detail="未偵測到選中食材")

    # 呼叫真實 AI 服務 (Call real AI service)
    recipes = call_ai_service(selected_ingredients, api_key)
    
    if recipes:
        print(f"✅ 成功生成 {len(recipes)} 個食譜")
        return recipes
    
    # 如果 AI 失敗，回傳備份數據 (Fallback to mock if AI fails)
    print("⚠️ 呼叫 AI 失敗，使用系統備份協議回傳")
    return [
        {
            "id": f"fallback_{abs(hash(str(selected_ingredients)))}",
            "name": "核心協議：全能型食材濃湯",
            "matchScore": 85,
            "description": "系統目前處於離線快取模式，提供基礎營養方案。",
            "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800",
            "time": "25 MIN",
            "difficulty": "MEDIUM",
            "category": "mixed",
            "requiredIngredients": selected_ingredients
        }
    ]

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
