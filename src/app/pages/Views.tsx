import { useNavigate, useParams } from "react-router";
import { useState, useEffect } from "react";
import {
    Camera, Sparkles, X, Plus, Minus, Package,
    Trash2, Search, Share2, ChefHat,
    User, Settings, HelpCircle, LogOut, ChevronRight, ChevronLeft,
    BookOpen, Clock, Users, Loader2, Mic, Edit2, AlertTriangle, Snowflake, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "../components/Shared";
import { useIngredients, ScannedItem } from "../services/IngredientContext";
import { formatRelativeTime } from "../services/timeUtils";
import { useCamera } from "../hooks/useCamera";
import { CameraView } from "../components/scanner/CameraView";

// Use consolidated components from inventory_management
import { DetectionRow } from "../components/inventory_management/DetectionRow";
import { DetectionSummary } from "../components/inventory_management/DetectionSummary";
import { InventoryStats } from "../components/inventory_management/InventoryStats";
import { AddEntryForm } from "../components/inventory_management/AddEntryForm";

import { getRecommendedRecipes, recipeDatabase } from "../data/recipes";
import { llmService } from "../services/llmService";
import { RecipeCard } from "../components/recipes/RecipeCard";
import { IngredientCloud } from "../components/recipes/IngredientCloud";
import { RecipeHero } from "../components/recipes/RecipeHero";
import { IngredientChecklist } from "../components/recipes/IngredientChecklist";
import { CookingProtocol } from "../components/recipes/CookingProtocol";
import { notificationService } from "../services/notificationService";

// --- Scanner Page ---
/**
 * 首頁掃描區 (Scanner)
 * 利用 `useCamera` Hook 啟動裝置攝影機。畫面會顯示鏡頭即時影像與辨識框（交由 CameraView 處理）。
 * 在此頁面使用 YOLO 模型針對影像內容進行推論，實現自動添加食材至庫存中。
 */
export function Scanner() {
    const navigate = useNavigate();
    const { scannedItems } = useIngredients();
    const { videoRef } = useCamera();

    return (
        <div className="pb-24">
            <div className="flex flex-col items-center justify-center px-6 pt-12 pb-4">
                <CameraView videoRef={videoRef} />

                {/* 顯示掃描到的食材暫存清單 */}
                <DetectionSummary />

                <p className="text-center text-gray-400 text-xs mt-8 px-10 leading-relaxed uppercase tracking-widest font-medium opacity-60">將鏡頭對準食材<br />AI 將自動辨識並同步庫存</p>
            </div>
        </div>
    );
}

// --- Ingredients Page ---
/**
 * 單一/近期掃描食材結果頁 (Ingredients)
 * 專門顯示系統剛剛辨識到或短期內加入的食材。
 * 可快速增減數量、刪除掃描出錯的項目，或是全部清除。
 */
export function Ingredients() {
    const navigate = useNavigate();
    const { scannedItems, updateQuantity, removeItem, clearAll } = useIngredients();
    return (
        <div className="pb-32">
            <PageHeader showBackButton title="最近辨識" rightAction={<button onClick={clearAll} className="p-2 sm:p-2.5 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-2xl border border-red-500/10 text-red-500"><Trash2 size={20} className="stroke-[2.5]" /></button>} />
            <div className="px-6 py-6">
                <h2 className="text-[11px] font-black text-white/30 uppercase tracking-[0.2em] mb-6 px-1 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-[#00ff88]" />掃描紀錄</h2>
                {scannedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white/5 rounded-[3.5rem] border border-white/5">
                        <div className="relative mb-8 group"><div className="absolute inset-0 bg-[#00ff88]/5 rounded-full blur-3xl" /><div className="relative w-24 h-24 bg-[#1a4d3d]/50 rounded-[2rem] border border-white/10 flex items-center justify-center shadow-2xl"><Plus size={40} className="text-[#00ff88]/20" /></div></div>
                        <h3 className="text-sm font-black text-white/30 uppercase tracking-widest mb-4">目前無數據暫存</h3>
                        <button onClick={() => navigate("/")} className="flex items-center gap-3 bg-[#00ff88] text-[#0f2e24] px-8 py-4 rounded-2xl font-black uppercase text-[10px] shadow-xl">啟動感測器</button>
                    </div>
                ) : (
                    <div className="space-y-3">{scannedItems.slice(0, 10).map((item) => (<DetectionRow key={item.id} item={item} onUpdate={updateQuantity} onRemove={removeItem} />))}</div>
                )}
            </div>
        </div>
    );
}

// --- Recipes Page ---
/**
 * AI 食譜生成頁 (Recipes)
 * 負責觸發大語言模型 (LLM) 呼叫，為用戶提供最佳的「清空方案」。
 * 從上下文中取得所有庫存食材，並透過 `llmService` 產生符合現有材料的創意食譜。
 */
export function Recipes() {
    const navigate = useNavigate();
    const { scannedItems, recommendedRecipes, setRecipes } = useIngredients();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (scannedItems.length > 0 && recommendedRecipes.length === 0) {
            const fetchRecipes = async () => {
                setIsLoading(true);
                try {
                    const res = await llmService.generateRecipes({ ingredients: scannedItems.map(i => i.name) });
                    setRecipes(res);
                } catch (error) {
                    setRecipes(getRecommendedRecipes(scannedItems)); // Local fallback
                } finally { setIsLoading(false); }
            };
            fetchRecipes();
        } else { setIsLoading(false); }
    }, [scannedItems, recommendedRecipes, setRecipes]);

    return (
        <div className="pb-24">
            <PageHeader showBackButton title="AI 推薦食譜" rightAction={<button className="p-2.5 bg-white/5 rounded-2xl hover:bg-white/10"><Share2 size={20} className="text-white" /></button>} />
            <div className="px-6 py-4">
                <IngredientCloud items={scannedItems} onAddMore={() => navigate("/inventory")} />
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-6 bg-white/5 rounded-[3rem] border border-white/10"><div className="relative w-16 h-16"><div className="absolute inset-0 border-2 border-[#00ff88]/20 rounded-full" /><div className="absolute inset-0 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" /><Sparkles className="absolute inset-0 m-auto text-[#00ff88] animate-pulse" size={20} /></div><div className="text-center"><h3 className="text-[#00ff88] font-black text-xs uppercase animate-pulse mb-1">運算中...</h3><p className="text-gray-500 text-[9px] font-bold uppercase">正在分析口味分佈</p></div></div>
                ) : recommendedRecipes.length > 0 ? (
                    <div className="space-y-8"><div className="bg-[#1a4d3d]/40 backdrop-blur-md rounded-[2.5rem] p-6 border border-[#00ff88]/20 flex items-start gap-4"><div className="w-12 h-12 rounded-2xl bg-[#00ff88] flex items-center justify-center flex-shrink-0 shadow-lg"><ChefHat size={24} className="text-[#0f2e24]" strokeWidth={2.5} /></div><div><h3 className="font-black text-xs text-white uppercase mb-1">AI 神經網路推薦</h3><p className="text-[10px] text-gray-400 font-bold uppercase leading-tight">已優化 <span className="text-[#00ff88]">{recommendedRecipes.length} 個相容節點</span> <br />惜食減廢協議已啟動</p></div></div><div className="grid grid-cols-1 gap-10">{recommendedRecipes.map((r) => (<RecipeCard key={r.id} recipe={r} onClick={() => navigate(`/recipe/${r.id}`)} getCategoryLabel={(c) => c === "vegetable" ? "蔬菜" : c === "fruit" ? "水果" : c === "meat" ? "肉類" : "綜合"} />))}</div></div>
                ) : (
                    <div className="text-center py-24 px-8 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5"><div className="w-20 h-20 mx-auto mb-6 bg-[#00ff88]/5 rounded-full flex items-center justify-center"><ChefHat size={40} className="text-[#00ff88]/20" /></div><h4 className="text-white font-black text-sm uppercase mb-2">未發現相容方案</h4><button onClick={() => navigate("/")} className="inline-flex items-center gap-3 px-8 py-4 bg-[#00ff88] text-[#0f2e24] rounded-2xl font-black uppercase text-[10px]">返回掃描</button></div>
                )}
            </div>
        </div>
    );
}
// --- Edit Item Modal ---
/**
 * 食材編輯對話框 (EditItemModal)
 * 當使用者點擊「編輯」按鈕時會彈出這一個燈箱。
 * 允許修改食材的名稱、關聯分類、保存位置 (冷藏/冷凍) 以及它的存放有效期限。
 * 當有效期限設為0，會觸發動態的紅色過期警告 UI 讓用戶確認。
 */
function EditItemModal({ item, onSave, onDismiss }: { item: any, onSave: (id: string, updates: any) => void, onDismiss: () => void }) {
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category || "其他");
    const [storageType, setStorageType] = useState(item.storageType || "fridge");
    const [expiryDays, setExpiryDays] = useState(item.expiryDays !== undefined ? item.expiryDays : 7);
    const [confirmingZero, setConfirmingZero] = useState(false);

    const handleConfirmSave = () => {
        if (expiryDays === 0 && !confirmingZero) {
            setConfirmingZero(true);
            return;
        }
        onSave(item.id, { name, category, storageType, expiryDays });
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#0f2e24]/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-[#1a4d3d] w-full max-w-sm rounded-[2.5rem] p-6 border border-white/10 shadow-2xl relative">
                <button onClick={onDismiss} className="absolute right-6 top-6 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white">
                    <X size={16} />
                </button>
                <div className="w-12 h-12 bg-[#00ff88]/10 rounded-2xl flex items-center justify-center mb-6">
                    <Edit2 size={24} className="text-[#00ff88]" />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-wider mb-6">編輯食材資訊</h3>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">食材名稱</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#0f2e24] border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#00ff88] outline-none transition-colors" />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">分類標籤</label>
                        <div className="flex flex-wrap gap-2">
                            {["蔬菜", "水果", "肉類", "乳製品", "五穀", "其他"].map(c => (
                                <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase border transition-all ${category === c ? 'bg-[#00ff88] text-[#0f2e24] border-[#00ff88]' : 'bg-white/5 text-gray-400 border-white/10'}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">保存位置</label>
                            <div className="flex bg-[#0f2e24] p-1 rounded-xl border border-white/10">
                                <button onClick={() => setStorageType('fridge')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${storageType === 'fridge' ? 'bg-white/10 text-white' : 'text-gray-500'}`}><ChefHat size={12} />冷藏</button>
                                <button onClick={() => setStorageType('freezer')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center gap-1 ${storageType === 'freezer' ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500'}`}><Snowflake size={12} />冷凍</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block tracking-widest">保鮮期 (天)</label>
                            <input type="number" min="0" value={expiryDays} onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)} className="w-full bg-[#0f2e24] border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:border-[#00ff88] outline-none transition-colors text-center" />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {confirmingZero && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <h4 className="text-red-500 font-black text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                                <AlertTriangle size={14} />警告：直接標記過期
                            </h4>
                            <p className="text-[10px] text-gray-400 font-bold leading-relaxed">
                                您將保存期限設為 0 天，食材將立刻被歸類至「已過期」。若確定請再次點擊下方按鈕。
                            </p>
                        </div>
                    )}

                    <button onClick={handleConfirmSave} className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${confirmingZero ? 'bg-red-500 text-white' : 'bg-[#00ff88] text-[#0f2e24]'}`}>
                        {confirmingZero ? '確定標記為過期' : '更新資料 (Update)'}
                    </button>
                    {confirmingZero && (
                        <button onClick={() => setConfirmingZero(false)} className="w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-white bg-white/5 transition-all">
                            取消操作 (Cancel)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// --- 庫存管理主要頁面 (Inventory Management Page) ---
/**
 * 全庫存管理頁 (Inventory)
 * 提供完整的冰箱內容清單，支援：
 * 1. 關鍵字搜尋與語音搜尋功能 (`startVoiceInput`)
 * 2. 分類標籤篩選 (全部、蔬菜、肉類等)
 * 3. 儲存區域切換 (冷藏庫 / 冷凍庫)
 * 4. 食材的手動新增與現有項目的參數編輯操作。
 */
export function Inventory() {
    const navigate = useNavigate();
    // 從 Context 獲取全域狀態與操作方法
    const { scannedItems, addItem, updateQuantity, removeIngredient, selectedIds, toggleSelection, generateRecipe, wasteHistory, updateItem } = useIngredients();
    const [isGenerating, setIsGenerating] = useState(false);

    // --- 手動調整參數：分頁、搜尋與過濾狀態 ---
    const [search, setSearch] = useState(""); // 搜尋關鍵字
    const [cat, setCat] = useState("全部"); // 食材分類標籤過濾
    const [showForm, setShowForm] = useState(false); // 是否顯示手動輸入表單
    const [storageTab, setStorageTab] = useState<"fridge" | "freezer">("fridge"); // 切換 冷藏/冷凍 分頁
    const [editingItem, setEditingItem] = useState<any>(null); // 當前正在編輯的食材對象
    const [isListening, setIsListening] = useState(false); // 語音辨識狀態 (啟動/停止)

    const categories = ["全部", "蔬菜", "水果", "乳製品", "肉類", "五穀", "其他"];
    const [catPage, setCatPage] = useState(0);

    const startVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return alert("您的瀏覽器不支援語音辨識功能！");

        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.start();
        setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearch(transcript);
            setIsListening(false);
        };
        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);
    };

    const filtered = scannedItems.filter(i =>
        (i.storageType || "fridge") === storageTab &&
        (cat === "全部" || i.category === cat) &&
        i.name.toLowerCase().includes(search.toLowerCase())
    );
    const total = scannedItems.reduce((s, i) => s + i.quantity, 0);
    const expiredCount = scannedItems.filter(i => {
        const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
        const expiryDays = i.expiryDays !== undefined ? i.expiryDays : 7;
        const daysLeft = expiryDays - daysPassed;
        return daysLeft <= 0 || i.isSpoiled; // <=0 as expired
    }).length;

    const handleSaveEdit = (id: string, updates: any) => {
        // Force timestamp reset to recalculate days cleanly from "today" when edited
        updateItem(id, { ...updates, timestamp: Date.now() });
        setEditingItem(null);
    };

    return (
        <div className="pb-24">
            <PageHeader showBackButton title="食材清單" rightAction={<button onClick={() => setShowForm(!showForm)} className="p-1.5 bg-[#00ff88] rounded-xl shadow-lg"><Plus size={20} className="text-[#0f2e24] stroke-[3]" /></button>} />

            <div className="bg-[#0f2e24] sticky top-[64px] z-20 pb-4 px-6 py-4">
                <div className="flex bg-white/5 p-1 rounded-2xl mb-4">
                    <button onClick={() => setStorageTab('fridge')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${storageTab === 'fridge' ? 'bg-[#00ff88] text-[#0f2e24]' : 'text-gray-400'}`}><ChefHat size={16} />冷藏庫</button>
                    <button onClick={() => setStorageTab('freezer')} className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2 ${storageTab === 'freezer' ? 'bg-blue-400 text-[#0f2e24]' : 'text-gray-400'}`}><Snowflake size={16} />冷凍庫</button>
                </div>

                <div className="relative flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input type="text" placeholder="搜尋食材..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:border-[#00ff88] text-sm font-bold placeholder:text-gray-600 outline-none" />
                    </div>
                    <button onClick={startVoiceInput} className={`p-4 rounded-2xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
                        <Mic size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <button 
                        onClick={() => setCatPage(p => Math.max(0, p - 1))}
                        disabled={catPage === 0}
                        className={`p-2 rounded-xl border border-white/10 transition-all ${catPage === 0 ? 'opacity-20 grayscale' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}
                    >
                        <ChevronLeft size={14} className="text-white" />
                    </button>
                    
                    <div className="flex-1 flex gap-2 overflow-hidden items-center justify-start">
                        {categories.slice(catPage * 4, (catPage + 1) * 4).map(c => (
                            <button 
                                key={c} 
                                onClick={() => setCat(c)} 
                                className={`flex-1 px-2 py-2.5 rounded-xl text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-300 ${cat === c ? (storageTab === 'fridge' ? "bg-[#00ff88] text-[#0f2e24] border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)] scale-105" : "bg-blue-400 text-[#0f2e24] border-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.3)] scale-105") : "bg-white/5 text-gray-500 border-white/10"}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={() => setCatPage(p => Math.min(Math.ceil(categories.length / 4) - 1, p + 1))}
                        disabled={(catPage + 1) * 4 >= categories.length}
                        className={`p-2 rounded-xl border border-white/10 transition-all ${(catPage + 1) * 4 >= categories.length ? 'opacity-20 grayscale' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}
                    >
                        <ChevronRight size={14} className="text-white" />
                    </button>
                </div>
            </div>

            {/* 統計圖已搬移至已儲存食譜頁面 */}

            <div className="px-6 mb-2">
                <button
                    onClick={async () => {
                        setIsGenerating(true);
                        try {
                            await generateRecipe();
                            navigate("/recipes");
                        } catch (e: any) {
                            alert(e.message);
                        } finally {
                            setIsGenerating(false);
                        }
                    }}
                    disabled={isGenerating || selectedIds.length === 0}
                    className={`w-full ${storageTab === 'fridge' ? 'bg-[#00ff88]' : 'bg-blue-400'} text-[#0f2e24] py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-[0_10px_30px_rgba(0,255,136,0.2)] flex items-center justify-center gap-3 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                >
                    {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isGenerating ? "Synthesizing..." : "生成 AI 食譜方案"}
                </button>
            </div>

            <InventoryStats totalItems={total} freshItems={scannedItems.length - expiredCount} expiredItems={expiredCount} />

            {showForm && (<AddEntryForm onAdd={addItem} onDismiss={() => setShowForm(false)} categories={["全部", "蔬菜", "水果", "乳製品", "肉類", "五穀", "其他"]} />)}

            <div className="px-6 py-4">
                <h3 className="font-black text-xs uppercase text-white/30 mb-4 px-2">存貨紀錄 ({filtered.length})</h3>
                {filtered.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
                        <Package size={48} className="mx-auto mb-4 text-white/10" />
                        <p className="text-[10px] font-bold text-gray-500">該庫存區域為空</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(i => {
                            const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                            const expiryDays = i.expiryDays !== undefined ? i.expiryDays : 7;
                            const daysLeft = expiryDays - daysPassed;
                            const isExpired = daysLeft <= 0;
                            const isWarning = !isExpired && daysLeft <= 2;

                            return (
                                <div key={i.id} className={`bg-[#1a4d3d]/30 rounded-2xl p-4 border transition-all relative overflow-hidden group ${i.isSpoiled || isExpired ? 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : isWarning ? 'border-amber-400/50 bg-amber-400/5 shadow-[0_0_20px_rgba(251,191,36,0.1)]' : 'border-white/5'}`}>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => toggleSelection(i.id)}
                                            disabled={i.isSpoiled || isExpired}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${i.isSpoiled || isExpired ? 'opacity-20 cursor-not-allowed border-gray-600' : selectedIds.includes(i.id) ? (storageTab === 'fridge' ? 'bg-[#00ff88] border-[#00ff88]' : 'bg-blue-400 border-blue-400') : 'bg-transparent border-white/20'}`}
                                        >
                                            {selectedIds.includes(i.id) && !i.isSpoiled && !isExpired && <div className="w-3 h-3 bg-[#0f2e24] rounded-sm" />}
                                            {(i.isSpoiled || isExpired) && <X size={12} className="text-red-500" />}
                                        </button>

                                        <div className="w-12 h-12 rounded-xl bg-[#0f2e24] flex items-center justify-center flex-shrink-0 relative">
                                            <Package size={20} className={i.isSpoiled || isExpired ? "text-red-500" : storageTab === 'fridge' ? "text-[#00ff88]" : "text-blue-400"} />
                                            {(i.isSpoiled || isExpired) && <div className="absolute inset-0 bg-red-500/10 rounded-xl" />}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-black text-sm truncate uppercase ${i.isSpoiled || isExpired ? 'text-red-500/70 line-through' : 'text-white'}`}>{i.name}</h4>
                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${i.isSpoiled ? 'bg-red-500/10 text-red-500' : storageTab === 'fridge' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-blue-400/10 text-blue-400'}`}>
                                                    {i.isSpoiled ? "品質異常" : (i.category || "其他")}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 ${isExpired || i.isSpoiled ? 'bg-red-500 text-white' : isWarning ? 'bg-amber-400 text-[#0f2e24]' : 'bg-white/5 text-gray-400'}`}>
                                                    <Clock size={8} />
                                                    {isExpired ? "已過期 (EXPIRED)" : i.isSpoiled ? "偵測毀損" : isWarning ? `即將到期 (${daysLeft}天)` : `保鮮 ${daysLeft} 天`}
                                                </span>
                                                <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 bg-white/5 text-gray-400">
                                                    {new Date(i.timestamp || Date.now()).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {(isExpired || i.isSpoiled) && <div className="text-[10px] font-black text-red-500 animate-pulse hidden sm:block">請移除食材</div>}
                                            {isWarning && <div className="text-[10px] font-black text-amber-400 animate-pulse hidden sm:block">儘速使用</div>}
                                            <button onClick={() => setEditingItem(i)} className="w-8 h-8 rounded-full bg-white/5 text-gray-400 flex items-center justify-center hover:text-white hover:bg-white/10 transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                                        <div className="flex items-center bg-[#0f2e24]/80 rounded-full p-1 border border-white/10">
                                            <button onClick={() => updateQuantity(i.id, -1)} className={`w-7 h-7 flex items-center justify-center text-gray-500 hover:${storageTab === 'fridge' ? 'text-[#00ff88]' : 'text-blue-400'}`}><Minus size={12} strokeWidth={3} /></button>
                                            <span className="w-8 text-center font-black text-white text-xs">{i.quantity}</span>
                                            <button onClick={() => updateQuantity(i.id, 1)} className={`w-7 h-7 flex items-center justify-center text-gray-500 hover:${storageTab === 'fridge' ? 'text-[#00ff88]' : 'text-blue-400'}`}><Plus size={12} strokeWidth={3} /></button>
                                        </div>
                                        <button onClick={() => removeIngredient(i.id)} className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center transition-all hover:bg-red-500 hover:text-white"><Trash2 size={12} strokeWidth={3} /></button>
                                    </div>

                                    {isWarning && !isExpired && (
                                        <div className="absolute top-0 right-0 w-8 h-8 overflow-hidden">
                                            <div className="absolute top-[-10px] right-[-10px] bg-amber-400 w-12 h-12 rotate-45 transform origin-bottom-left flex items-end justify-center pb-1">
                                                <AlertTriangle size={8} className="text-[#0f2e24] -rotate-45" strokeWidth={3} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {editingItem && (
                <EditItemModal
                    item={editingItem}
                    onSave={handleSaveEdit}
                    onDismiss={() => setEditingItem(null)}
                />
            )}
        </div>
    );
}

// --- Neural Analytics Dashboard ---
/**
 * 數據分析面板 (AnalyticsDashboard)
 * 應用程式最核心的數據視覺化區域，展示兩個維度：
 * 1. 歷史 (History): 將使用者過去 30 天內丟棄/浪費的食材量，以圖表型態渲染。
 * 2. 預測 (Predict): 基於所有食材的保存期限進行推測，以比例條與高危險清單的形式，警告用戶哪些食材即將浪費。
 */
function NeuralAnalyticsDashboard({ data, scannedItems }: { data: any[], scannedItems: ScannedItem[] }) {
    const [tab, setTab] = useState<"history" | "predict">("history");
    const [chartPage, setChartPage] = useState(0); // 0 = 當週, 1 = 前一週...
    const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
    
    // 確保 data 始終是陣列
    const chartData = Array.isArray(data) ? data : [];
    
    // 每頁顯示 7 天
    const PAGE_SIZE = 7;
    const endIdx = chartData.length - (chartPage * PAGE_SIZE);
    const startIdx = Math.max(0, endIdx - PAGE_SIZE);
    const visibleData = chartData.slice(Math.max(0, startIdx), Math.max(0, endIdx));

    // 計算預測浪費 (未來 3 天內過期的)
    const expiringSoon = scannedItems.filter(i => {
        const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
        const daysLeft = (i.expiryDays !== undefined ? i.expiryDays : 7) - daysPassed;
        return daysLeft >= 0 && daysLeft <= 3 && !i.isSpoiled; 
    });

    const totalWaste = chartData.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const sustainabilityIndex = Math.max(0, 100 - (totalWaste * 2)); 
    const maxVal = Math.max(...chartData.map(d => Number(d.amount) || 0), 2);
    const chartHeight = 80;

    // 開發者日誌：協助追蹤數據流
    useEffect(() => {
        console.log("📊 [Analytics] Total Data Points:", chartData.length);
        console.log("📊 [Analytics] Current Page Data:", visibleData);
    }, [chartPage, chartData, visibleData]);

    return (
        <div className="bg-[#1a4d3d]/30 rounded-[2.5rem] p-6 border border-white/5 mb-8 relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00ff88]/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="flex items-center justify-between mb-8 relative z-20">
                <div>
                    <h3 className="text-[10px] font-black text-[#00ff88] uppercase tracking-[0.2em] mb-1">食材損耗分析 (Waste Analytics)</h3>
                    <div className="flex items-center gap-2">
                        <div className="text-xl font-black text-white tracking-tighter">{sustainabilityIndex}%</div>
                        <div className="text-[8px] font-bold text-gray-500 uppercase tracking-widest border-l border-white/10 pl-2">食材利用效率</div>
                    </div>
                </div>
                <div className="flex bg-[#0f2e24] p-1 rounded-xl border border-white/10">
                    <button onClick={() => setTab("history")} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${tab === "history" ? "bg-[#00ff88] text-[#0f2e24]" : "text-gray-500"}`}>歷史</button>
                    <button onClick={() => setTab("predict")} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${tab === "predict" ? "bg-amber-400 text-[#0f2e24]" : "text-gray-500"}`}>預測</button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {tab === "history" ? (
                    <motion.div
                        key="history"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative w-full"
                    >
                        {/* 分頁控制器 */}
                        <div className="flex items-center justify-between mb-2 px-1">
                            <button 
                                onClick={() => setChartPage(p => p + 1)} 
                                disabled={startIdx === 0}
                                className={`p-1.5 rounded-full border border-white/10 transition-all ${startIdx === 0 ? 'opacity-20 grayscale' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}
                            >
                                <ChevronLeft size={16} className="text-white" />
                            </button>
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">
                                {visibleData.length > 0 ? `${visibleData[0].date} ~ ${visibleData[visibleData.length-1].date}` : "無數據"}
                            </span>
                            <button 
                                onClick={() => setChartPage(p => p - 1)} 
                                disabled={chartPage === 0}
                                className={`p-1.5 rounded-full border border-white/10 transition-all ${chartPage === 0 ? 'opacity-20 grayscale' : 'bg-white/5 hover:bg-white/10 active:scale-90'}`}
                            >
                                <ChevronRight size={16} className="text-white" />
                            </button>
                        </div>

                        <div className="h-[140px] w-full flex items-end justify-between px-2 pt-10 pb-4 relative">
                            {visibleData.length > 0 ? visibleData.map((d, i) => {
                                const height = (Number(d.amount) / maxVal) * chartHeight;
                                return (
                                    <div 
                                        key={i} 
                                        onClick={() => setSelectedRecord(d.amount > 0 ? d : null)}
                                        className={`flex-1 flex flex-col items-center gap-2 group/bar relative cursor-pointer transition-transform ${selectedRecord?.date === d.date ? 'scale-110' : 'hover:scale-105'}`}
                                    >
                                        <div className="absolute top-0 opacity-0 group-hover/bar:opacity-100 transition-all duration-300 -translate-y-4 group-hover/bar:-translate-y-2 flex flex-col items-center z-30">
                                            <span className="bg-[#00ff88] text-[#0f2e24] text-[8px] font-black px-2 py-1 rounded-lg tracking-widest shadow-[0_0_15px_rgba(0,255,136,0.3)] whitespace-nowrap">
                                                浪費 {d.amount}
                                            </span>
                                            <div className="w-1.5 h-1.5 bg-[#00ff88] rotate-45 -mt-1" />
                                        </div>
                                        <div className="relative w-full flex items-end justify-center">
                                            <motion.div
                                                initial={{ height: 0 }}
                                                animate={{ height: Math.max(2, height) }}
                                                className={`w-4 sm:w-6 rounded-t-full transition-all duration-500 ${selectedRecord?.date === d.date ? 'bg-white brightness-150' : (d.amount >= 3 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]')}`}
                                            />
                                        </div>
                                        <span className={`text-[7px] font-black transition-colors ${selectedRecord?.date === d.date ? 'text-white underline' : 'text-gray-500 group-hover/bar:text-white'}`}>
                                            {d.date.split("-")[2]}日
                                        </span>
                                    </div>
                                );
                            }) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                                    <div className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">無可顯示之數據</div>
                                </div>
                            )}
                            <div className="absolute bottom-4 left-0 w-full h-[1px] bg-white/5 -z-10" />
                            <div className="absolute top-2 left-0 text-[7px] font-black text-gray-500/50 uppercase tracking-widest">週損耗趨勢報表</div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="predict"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="py-2"
                    >
                        {(() => {
                            const total = scannedItems.length;
                            if (total === 0) {
                                return (
                                    <div className="flex flex-col items-center justify-center py-6 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                        <Package size={24} className="text-white/20 mb-3" />
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">請先新增食材以啟用預測</p>
                                    </div>
                                );
                            }

                            const riskItems = scannedItems.filter(i => {
                                const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                const daysLeft = (i.expiryDays !== undefined ? i.expiryDays : 7) - daysPassed;
                                return daysLeft > 0 && daysLeft <= 2 && !i.isSpoiled; // Exclude already expired (0)
                            });
                            const warningItems = scannedItems.filter(i => {
                                const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                const daysLeft = (i.expiryDays !== undefined ? i.expiryDays : 7) - daysPassed;
                                return daysLeft > 2 && daysLeft <= 5 && !i.isSpoiled;
                            });
                            const safeItems = scannedItems.filter(i => {
                                const daysPassed = Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                const daysLeft = (i.expiryDays !== undefined ? i.expiryDays : 7) - daysPassed;
                                return daysLeft > 5 && !i.isSpoiled;
                            });

                            const getWidth = (val: number) => `${Math.max((val / total) * 100, 0)}%`;

                            const renderAllRiskItems = () => {
                                if (riskItems.length === 0 && warningItems.length === 0) return null;

                                return (
                                    <div className="mt-4 pt-4 border-t border-white/5 space-y-2 relative z-10">
                                        <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">優先處理建議 (近迫排序)</div>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            {[...riskItems, ...warningItems]
                                                .sort((a, b) => {
                                                    const getA = (a.expiryDays !== undefined ? a.expiryDays : 7) - Math.floor((Date.now() - (a.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                                    const getB = (b.expiryDays !== undefined ? b.expiryDays : 7) - Math.floor((Date.now() - (b.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                                    return getA - getB;
                                                })
                                                .map(i => {
                                                    const daysLeft = (i.expiryDays !== undefined ? i.expiryDays : 7) - Math.floor((Date.now() - (i.timestamp || Date.now())) / (1000 * 60 * 60 * 24));
                                                    const isRisk = daysLeft <= 2;
                                                    return (
                                                        <div key={i.id} className={`flex-shrink-0 whitespace-nowrap px-3 py-2 rounded-xl flex items-center gap-2 border ${isRisk ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-400/10 border-amber-400/20'}`}>
                                                            <span className="text-[10px] font-black uppercase text-white">{i.name}</span>
                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${isRisk ? 'bg-red-500/20 text-red-500' : 'bg-amber-400/20 text-amber-400'}`}>
                                                                剩餘 {daysLeft} 天
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                );
                            };

                            return (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mt-2 mb-2">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">全庫存壽命分佈預測</span>
                                        <span className="text-[8px] font-bold text-gray-500 uppercase">{total} ITEMS</span>
                                    </div>

                                    {/* 視覺化分佈進度條 */}
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex shadow-inner mb-4">
                                        {riskItems.length > 0 && <div style={{ width: getWidth(riskItems.length) }} className="bg-red-500 transition-all duration-1000 animate-pulse border-r border-[#0f2e24]" />}
                                        {warningItems.length > 0 && <div style={{ width: getWidth(warningItems.length) }} className="bg-amber-400 transition-all duration-1000 border-r border-[#0f2e24]" />}
                                        {safeItems.length > 0 && <div style={{ width: getWidth(safeItems.length) }} className="bg-[#00ff88] transition-all duration-1000 border-r border-[#0f2e24]" />}
                                        {(total - riskItems.length - warningItems.length - safeItems.length > 0) && <div style={{ width: getWidth(total - riskItems.length - warningItems.length - safeItems.length) }} className="bg-gray-600 transition-all duration-1000" />}
                                    </div>

                                    {/* 指標與建議 */}
                                    <div className="grid grid-cols-3 gap-2 relative z-10">
                                        <div className="bg-white/5 rounded-xl p-3 border text-left border-red-500/20 relative">
                                            <div className="text-[8px] font-black text-gray-500 uppercase mb-1">1-2 天 (高風險)</div>
                                            <div className="text-lg font-black text-red-500">{riskItems.length}</div>
                                            <div className="text-[7px] text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{riskItems.length > 0 ? "建議立即合成" : "無近迫風險"}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border text-left border-amber-400/20 relative">
                                            <div className="text-[8px] font-black text-gray-500 uppercase mb-1">3-5 天 (需注意)</div>
                                            <div className="text-lg font-black text-amber-400">{warningItems.length}</div>
                                            <div className="text-[7px] text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">{warningItems.length > 0 ? "準備排入計畫" : "暫無疑慮"}</div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 border text-left border-[#00ff88]/20 relative">
                                            <div className="text-[8px] font-black text-gray-500 uppercase mb-1">&gt; 5 天 (安全)</div>
                                            <div className="text-lg font-black text-[#00ff88]">{safeItems.length}</div>
                                            <div className="text-[7px] text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">庫存穩定</div>
                                        </div>
                                    </div>

                                    {/* 展開顯示細節 */}
                                    {renderAllRiskItems()}
                                </div>
                            );
                        })()}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 歷史細節顯示區 */}
            <AnimatePresence>
                {tab === "history" && selectedRecord && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-white/5 bg-black/20 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="text-[8px] font-black text-[#00ff88] uppercase tracking-widest flex items-center gap-2">
                                    <Clock size={10} /> {selectedRecord.date} 浪費清單
                                </div>
                                <button onClick={() => setSelectedRecord(null)} className="text-[8px] font-black text-gray-500 uppercase">返回</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedRecord.items?.map((item: string, idx: number) => (
                                    <div key={idx} className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-[10px] font-black text-white uppercase">{item}</span>
                                    </div>
                                )) || <div className="text-[9px] text-gray-500 font-bold uppercase py-2">無具體品項記錄</div>}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 底部摘要 */}
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-center border-r border-white/10 pr-4">
                        <div className="text-[10px] font-black text-white">{data.reduce((s, d) => s + d.amount, 0)}</div>
                        <div className="text-[6px] font-bold text-gray-500 uppercase">本週浪費</div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black text-[#00ff88]">+{Math.floor(sustainabilityIndex / 10)}</div>
                        <div className="text-[6px] font-bold text-gray-500 uppercase">環保等級</div>
                    </div>
                </div>
                <div className="text-[8px] font-black text-white/20 uppercase tracking-widest">系統狀態: 運行中</div>
            </div>
        </div>
    );
}

// --- Profile & Saved & Detail (Simplified Combined) ---
/**
 * 個人設定頁 (Profile)
 * 提供使用者客製化自己的系統設定，目前實作了：
 * 1. 系統通知開關 (連動 Notification API 提出系統授權申請)
 * 2. 系統外觀深色模式切換 (Dark Mode toggle - 但整個系統目前強制採用暗色賽博龐克為主)
 */
export function Profile() {
    const { settings, updateSettings, clearAll, scannedItems } = useIngredients();
    const nav = useNavigate();

    return (
        <div className="pb-24 px-6 py-8">
            <PageHeader title="個人設定" />
            
            <div className="flex flex-col items-center mb-10 mt-4">
                <div className="w-28 h-28 rounded-full bg-[#1a4d3d] border-4 border-[#00ff88]/20 flex items-center justify-center shadow-2xl mb-6 relative">
                    <div className="absolute inset-0 bg-[#00ff88]/5 rounded-full animate-pulse" />
                    <User size={48} className="text-[#00ff88] relative z-10" strokeWidth={1} />
                </div>
                <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">使用者中心</h2>
                <div className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest opacity-60">已認證：首席美食品味家</div>
            </div>

            {/* Neural Matrix Settings */}
            <div className="bg-[#1a4d3d]/20 p-6 rounded-[2.5rem] border border-white/5 mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88]/5 rounded-full blur-3xl pointer-events-none" />
                
                <h3 className="text-[10px] font-black text-[#00ff88] uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                    <Settings size={12} /> 系統功能設定 (System Settings)
                </h3>
                
                <div className="space-y-6">
                    {/* Notification Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center"><AlertTriangle size={18} className="text-blue-400" /></div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase">食材過期提醒</div>
                                <div className="text-[8px] font-bold text-gray-500 uppercase">智慧監測食材效期並發送通知</div>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const newSetting = !settings.notifications;
                                if (newSetting) await notificationService.requestPermission();
                                updateSettings({ notifications: newSetting });
                            }}
                            className={`w-12 h-6 rounded-full relative transition-all duration-500 ${settings.notifications ? "bg-[#00ff88]" : "bg-white/10"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.notifications ? "left-7" : "left-1"}`} />
                        </button>
                    </div>

                    {/* Neural Optimization Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center"><Sparkles size={18} className="text-purple-400" /></div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase">掃描性能優化</div>
                                <div className="text-[8px] font-bold text-gray-500 uppercase">提升物體辨識的反應速度</div>
                            </div>
                        </div>
                        <button
                            onClick={() => updateSettings({ neuralOptimized: !settings.neuralOptimized })}
                            className={`w-12 h-6 rounded-full relative transition-all duration-300 ${settings.neuralOptimized ? "bg-purple-500" : "bg-white/10"}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${settings.neuralOptimized ? "left-7" : "left-1"}`} />
                        </button>
                    </div>

                    {/* Confidence Threshold Slider */}
                    <div className="pt-2">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <div className="text-[10px] font-black text-white uppercase">辨識靈敏度</div>
                                <div className="text-[8px] font-bold text-gray-500 uppercase">調整視覺辨識的嚴謹門檻</div>
                            </div>
                            <div className="text-xs font-black text-[#00ff88]">{Math.round(settings.confidenceThreshold * 100)}%</div>
                        </div>
                        <input 
                            type="range" 
                            min="0.1" 
                            max="0.9" 
                            step="0.05" 
                            value={settings.confidenceThreshold} 
                            onChange={(e) => updateSettings({ confidenceThreshold: parseFloat(e.target.value) })}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
                        />
                    </div>
                </div>
            </div>

            {/* Support & Data Management */}
            <div className="bg-[#1a4d3d]/20 p-6 rounded-[2.5rem] border border-white/5 mb-8">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-6 px-1">資料與權限管理</h3>
                <div className="space-y-4">
                    <button onClick={() => nav("/saved")} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center"><HelpCircle size={18} className="text-amber-400" /></div>
                            <div>
                                <div className="text-[10px] font-black text-white uppercase">查看食材耗損分析</div>
                                <div className="text-[8px] font-bold text-gray-500 uppercase">分析您過去的食材利用效率</div>
                            </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-600" />
                    </button>

                    <button 
                        onClick={() => {
                            if (window.confirm("確定要清空所有存儲的食材數據嗎？")) {
                                clearAll();
                                alert("數據已重置。");
                            }
                        }}
                        className="w-full flex items-center justify-between p-4 bg-red-500/5 rounded-2xl border border-red-500/10 hover:bg-red-500/10 transition-all text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"><LogOut size={18} className="text-red-500" /></div>
                            <div>
                                <div className="text-[10px] font-black text-red-500 uppercase font-black">清空所有資料</div>
                                <div className="text-[8px] font-bold text-gray-500 uppercase">重置所有存儲的食材記錄</div>
                            </div>
                        </div>
                    </button>
                </div>
            </div>

            <div className="text-center">
                <div className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">VERSION 1.0.0 LITE / NEURAL CORE v2</div>
            </div>
        </div>
    );
}

/**
 * 系統數據中心 / 保存內容頁 (Saved / Data Statistics)
 * 本頁面整合了 NeuralAnalyticsDashboard 作為主要視覺呈現區塊。
 * 當未來有實作「我的最愛食譜」時，這頁面也會用來陳列使用者過去儲存的高品質 AI 生成食譜。
 */
export function Saved() {
    const nav = useNavigate();
    const { wasteHistory, scannedItems, savedRecipes, unsaveRecipe } = useIngredients();

    return (
        <div className="pb-24 pt-6">
            <PageHeader showBackButton title="數據統計" />
            <div className="px-6 mb-8 mt-2 text-left">
                <NeuralAnalyticsDashboard data={wasteHistory} scannedItems={scannedItems} />
            </div>

            {savedRecipes.length === 0 ? (
                <div className="px-6 flex flex-col items-center justify-center py-12 text-center bg-white/5 rounded-[2rem] border border-white/5 mx-6">
                    <div className="w-20 h-20 bg-[#00ff88]/5 rounded-full border border-[#00ff88]/10 flex items-center justify-center mb-6">
                        <BookOpen size={32} className="text-[#00ff88]/20" />
                    </div>
                    <h2 className="text-[11px] font-black text-white/50 uppercase mb-5 tracking-widest">暫無儲存的食譜方案</h2>
                    <button onClick={() => nav("/")} className="bg-[#00ff88] text-[#0f2e24] px-10 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-lg hover:scale-105 transition-all">
                        啟動掃描器去發掘
                    </button>
                </div>
            ) : (
                <div className="px-6 space-y-6">
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-widest px-2">我的收藏食譜 ({savedRecipes.length})</h3>
                    <div className="grid grid-cols-1 gap-6">
                        {savedRecipes.map((recipe) => (
                            <div key={recipe.id} className="relative group">
                                <RecipeCard 
                                    recipe={recipe} 
                                    onClick={() => nav(`/recipe/${recipe.id}`)}
                                    getCategoryLabel={(c) => c === "vegetable" ? "蔬菜" : c === "fruit" ? "水果" : c === "meat" ? "肉類" : "綜合"}
                                />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); unsaveRecipe(recipe.id); }}
                                    className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-red-500/20 text-red-500 border border-red-500/20 flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 食譜細節與烹調引導頁 (RecipeDetail)
 * 當使用者從「AI 推薦」列表中點擊特定食譜時進入的畫面。
 * 支援功能：
 * 1. 食材勾選清單 (`IngredientChecklist`)
 * 2. 逐步文字料理步驟 (`CookingProtocol`)
 * 3. 系統通知「儲存食譜」到雲端的實作彈窗
 * 4. 如果食譜壞了或不滿意，可以點擊「重新分析」再次推論 LLM 提供新食譜。
 */
export function RecipeDetail() {
    const { id } = useParams();
    const nav = useNavigate();
    const { recommendedRecipes, scannedItems, setRecipes, saveRecipe, savedRecipes } = useIngredients();

    const [showSaveModal, setShowSaveModal] = useState(false);

    // 修正：使用 useMemo 確保即使推薦列表非同步更新，詳情頁也能抓到資料
    const recipe = recommendedRecipes.find(r => r.id === id) ||
        recipeDatabase.find(r => r.id === id) ||
        savedRecipes.find(r => r.id === id) ||
        {
            name: "AI 合成食譜",
            image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
            time: "15 分鐘",
            difficulty: "簡單",
            requiredIngredients: ["番茄", "菠菜"],
            optionalIngredients: [],
            description: "智慧生成食譜。"
        };

    const [checked, setChecked] = useState<boolean[]>([]);
    
    // 初始化勾選狀態
    useEffect(() => {
        if (recipe && recipe.requiredIngredients) {
            setChecked(new Array(recipe.requiredIngredients.length).fill(false));
        }
    }, [recipe]);

    return (
        <div className="pb-32"><PageHeader showBackButton title="烹飪指南" /><RecipeHero image={recipe.image} name={recipe.name} />
            <div className="px-6 py-8"><div className="grid grid-cols-3 gap-3 mb-10">{[{ i: Clock, v: recipe.time }, { i: ChefHat, v: recipe.difficulty }, { i: Users, v: "2-3人份" }].map((s, i) => (<div key={i} className="bg-white/5 rounded-2xl p-4 text-center"><s.i className="w-4 h-4 mx-auto mb-2 text-[#00ff88]" /><div className="text-xs font-black text-white">{s.v}</div></div>))}</div>
                <IngredientChecklist ingredients={recipe.requiredIngredients} checkedItems={checked} onToggle={(i) => { const n = [...checked]; n[i] = !n[i]; setChecked(n); }} progress={Math.round((checked.filter(Boolean).length / recipe.requiredIngredients.length) * 100)} />
                <CookingProtocol steps={recipe.steps || [{ title: "初始化", description: "準備食材。" }, { title: "執行", description: "標準烹飪。" }]} />

                {/* 重新分析按鈕放置於最底部 */}
                <div className="mt-12 mb-8 px-2">
                    <button
                        onClick={async () => {
                            try {
                                const ingredientsToUse = scannedItems.map(i => i.name);
                                const res = await llmService.generateRecipes({ ingredients: ingredientsToUse });
                                setRecipes(res);
                                alert("AI 食譜已重新合成！");
                            } catch (e: any) {
                                alert("更新食譜失敗");
                            }
                        }}
                        className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-5 rounded-2xl text-[10px] font-black text-[#00ff88] uppercase tracking-[0.2em] hover:bg-[#00ff88]/10 transition-all shadow-lg text-center"
                    >
                        <Sparkles size={18} />
                        重新分析並合成新方案
                    </button>
                </div>

                <button 
                    onClick={() => {
                        saveRecipe(recipe);
                        setShowSaveModal(true);
                    }} 
                    className={`w-full py-5 rounded-2xl font-black text-sm uppercase shadow-lg flex items-center justify-center gap-3 mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all ${savedRecipes.find(r => r.id === recipe.id) ? 'bg-white/10 text-white' : 'bg-[#00ff88] text-[#0f2e24]'}`}
                >
                    <BookOpen size={20} />
                    {savedRecipes.find(r => r.id === recipe.id) ? '已儲存此食譜' : '儲存食譜'}
                </button>
            </div>

            <AnimatePresence>
                {showSaveModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-[#0f2e24]/90 backdrop-blur-xl flex items-center justify-center p-6 pb-[15vh] sm:pb-6">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-[#1a4d3d] w-full max-w-sm max-h-[75vh] flex flex-col rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">

                            <button onClick={() => setShowSaveModal(false)} className="absolute right-4 top-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-gray-300 hover:text-white backdrop-blur-md transition-colors">
                                <X size={16} />
                            </button>

                            <div className="p-6 pb-4 shrink-0 relative z-10 border-b border-white/5 bg-[#1a4d3d]">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#00ff88]/20 rounded-2xl flex items-center justify-center text-[#00ff88] border border-[#00ff88]/10 shadow-lg">
                                        <BookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest">食譜已儲存</h3>
                                        <div className="text-[10px] font-bold tracking-widest text-[#00ff88] mt-0.5">已同步至雲端與暫存清單</div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto w-full flex-1 relative z-10 space-y-4 bg-[#0f2e24]/30">
                                <div>
                                    <h4 className="font-black text-xl text-white tracking-widest mb-2 leading-tight flex items-start gap-2">
                                        <ChefHat size={18} className="text-[#00ff88] mt-1 shrink-0" />
                                        {recipe.name}
                                    </h4>
                                    <div className="text-[11px] text-gray-400 font-bold leading-relaxed">{recipe.description}</div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-inner">
                                    <div className="text-[10px] text-[#00ff88] mb-3 font-black uppercase tracking-widest flex items-center gap-2">
                                        <ChefHat size={12} />所需食材
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {recipe.requiredIngredients.map((ing: string, idx: number) => (
                                            <span key={idx} className="bg-black/30 border border-white/10 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold">
                                                {ing}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5 shadow-inner">
                                    <div className="text-[10px] text-amber-400 mb-3 font-black uppercase tracking-widest flex items-center gap-2">
                                        <BookOpen size={12} />烹飪步驟
                                    </div>
                                    <div className="space-y-4">
                                        {recipe.steps ? recipe.steps.map((s: any, idx: number) => (
                                            <div key={idx} className="flex gap-3">
                                                <div className="w-6 h-6 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center text-[10px] font-black shrink-0 border border-amber-400/20">
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <div className="text-white font-black text-[11px] tracking-wider mb-1 mt-0.5">{s.title}</div>
                                                    <div className="text-gray-400 text-[10px] leading-relaxed font-bold">{s.description}</div>
                                                </div>
                                            </div>
                                        )) : <div className="text-[10px] text-gray-500 font-bold tracking-widest">無詳細步驟</div>}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 shrink-0 relative z-10 bg-[#1a4d3d] border-t border-white/5">
                                <button onClick={() => { setShowSaveModal(false); nav("/saved"); }} className="w-full bg-[#00ff88] text-[#0f2e24] py-4 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all">
                                    前往數據統計查看
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
