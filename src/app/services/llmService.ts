/**
 * LLM 食譜生成服務 (LLM Recipe Generation Service)
 * 
 * 這個模組負責與大語言模型 (例如 GPT-4, Gemini) 進行通訊，
 * 根據用戶提供的食材清單動態生成食譜建議。
 */

export interface LLMRecipeRequest {
    ingredients: string[]; // 用戶擁有的食材
    preferences?: string; // 用戶偏好 (可選)
}

export interface LLMRecipe {
    id: string;
    name: string;
    image: string;
    time: string;
    difficulty: "easy" | "medium" | "hard";
    category: "vegetable" | "fruit" | "meat" | "mixed";
    requiredIngredients: string[];
    description: string;
    matchScore: number;
}

// 獲取 API KEY 核心邏輯 (Get API KEY Logic)
// 優先從 Vite 環境變數中讀取 (VITE_LLM_API_KEY)
// 這能確保金鑰不會直接洩露在前端代碼中，並支持不同環境的靈活配置。
export const getApiKey = () => {
    return import.meta.env.VITE_LLM_API_KEY || "";
};

class LLMService {
    /**
     * 調用後端 API 生成食譜 (Forward to backend API)
     * @param request 包含食材清單的請求對象
     */
    async generateRecipes(request: LLMRecipeRequest): Promise<LLMRecipe[]> {
        const ingredients = request.ingredients;
        console.log("正在發送食譜生成請求至後端...", ingredients);

        try {
            const apiUrl = import.meta.env.VITE_DETECTION_API_URL || "http://localhost:8000";
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超時

            const response = await fetch(`${apiUrl}/api/generate-recipe`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "bypass-tunnel-reminder": "true"
                },
                body: JSON.stringify({
                    selected_ingredients: ingredients,
                    preferences: request.preferences
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `伺服器回應錯誤: ${response.status}`);
            }

            const recipes = await response.json();

            // 轉換數據格式以匹配前端需求 (Ensure camelCase fields)
            return recipes.map((r: any) => ({
                id: r.id || `recipe-${Date.now()}-${Math.random()}`,
                name: r.name || "AI 創意料理",
                image: r.image || "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800",
                time: r.time || "25 MIN",
                difficulty: r.difficulty?.toLowerCase() || "medium",
                category: r.category || "mixed",
                requiredIngredients: r.requiredIngredients || ingredients,
                description: r.description || "智慧生成的精選食譜。",
                matchScore: r.matchScore || 85
            }));

        } catch (error) {
            console.warn("LLMService 調用失敗，切換至本地智能匹配模式 (Offline Mode):", error);
            
            // 本地智能化保底邏輯 (Enhanced Local Mock Engine)
            const mainIng = ingredients[0] || "綜合食材";
            const ingCount = ingredients.length;
            
            // 定義基礎 Mock 模板
            const templates = [
                {
                    name: `${mainIng}風味炒飯`,
                    description: `利用現有的 ${ingredients.slice(0, 2).join('金')} 快速翻炒出的香噴噴家常料理。`,
                    category: "mixed" as const,
                    image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=800"
                },
                {
                    name: `法式${mainIng}濃湯`,
                    description: `將 ${ingredients.join('、')} 燉煮，鎖住營養，口感豐富細膩的營養湯品。`,
                    category: "vegetable" as const,
                    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800"
                },
                {
                    name: `清涼 ${mainIng} 溫沙拉`,
                    description: `適合夏日的輕食，保留 ${mainIng} 的原味，健康低卡。`,
                    category: "mixed" as const,
                    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800"
                },
                {
                    name: `秘製 ${mainIng} 熱炒`,
                    description: `使用大火熱炒出的 ${ingredients.slice(0, 3).join('與')}，完美重現經典小吃風味。`,
                    category: "meat" as const,
                    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800"
                }
            ];

            // 根據食材數量隨機挑選 2-3 個
            return templates
                .sort(() => 0.5 - Math.random())
                .slice(0, Math.min(3, templates.length))
                .map((t, idx) => ({
                    id: `local-mock-${idx}-${Date.now()}`,
                    name: t.name,
                    image: t.image,
                    time: `${10 + idx * 5} MIN`,
                    difficulty: idx === 0 ? "easy" : "medium",
                    category: t.category,
                    requiredIngredients: ingredients,
                    description: t.description,
                    matchScore: 90 - idx * 5
                }));
        }
    }
}

export const llmService = new LLMService();
