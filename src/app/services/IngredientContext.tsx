import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { llmService } from "./llmService";
import { notificationService } from "./notificationService";

/**
 * 介面 (Interface): 單件掃描食材 (ScannedItem)
 * 用於規範每一個被系統記錄或 YOLO 辨識出來的食材結構。
 */
export interface ScannedItem {
    id: string;
    name: string;
    quantity: number;
    timestamp: number;
    category?: string;
    freshness?: number; // 0-10
    expiryDays?: number; // Days until expiry
    confidence?: number;
    isSpoiled?: boolean;
    box?: number[]; // [x1, y1, x2, y2]
    storageType?: "fridge" | "freezer";
}

export interface WasteRecord {
    date: string;
    amount: number; // in grams or items
    items?: string[]; // 具體浪費的食材名稱清單
}

interface IngredientContextType {
    scannedItems: ScannedItem[];
    recommendedRecipes: any[];
    tempDetections: ScannedItem[];
    selectedIds: string[];
    settings: { notifications: boolean; neuralOptimized: boolean; confidenceThreshold: number };
    wasteHistory: WasteRecord[];
    savedRecipes: any[];
    addItem: (item: Partial<ScannedItem>) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItem: (id: string, updates: Partial<ScannedItem>) => void;
    removeItem: (id: string) => void;
    removeIngredient: (id: string) => void;
    toggleSelection: (id: string) => void;
    generateRecipe: () => Promise<void>;
    saveRecipe: (recipe: any) => void;
    unsaveRecipe: (recipeId: string) => void;
    clearAll: () => void;
    setRecipes: (recipes: any[]) => void;
    clearTempDetections: () => void;
    updateSettings: (settings: Partial<{ notifications: boolean; neuralOptimized: boolean; confidenceThreshold: number }>) => void;
}

/**
 * 上下文宣告 (Context Context): IngredientContext
 * 用來實現跨元件共享狀態 (Global State)，避免 Props Drilling。
 */
const IngredientContext = createContext<IngredientContextType | undefined>(undefined);

/**
 * 狀態池提供者 (Provider): IngredientProvider
 * 必須包在應用程式的最外層 (如 App.tsx)，它持有並管理所有核心業務資料：
 * 1. 冰箱內所有庫存 (scannedItems)
 * 2. 暫存辨識清單 (tempDetections)
 * 3. 系統全域設定 (settings)
 * 4. 食譜庫 (recommendedRecipes)
 */
export function IngredientProvider({ children }: { children: ReactNode }) {
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [recommendedRecipes, setRecommendedRecipes] = useState<any[]>([]);
    const [tempDetections, setTempDetections] = useState<ScannedItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [settings, setSettings] = useState({ notifications: true, neuralOptimized: true, confidenceThreshold: 0.25 });
    const [savedRecipes, setSavedRecipes] = useState<any[]>([]);

    const [wasteHistory, setWasteHistory] = useState<WasteRecord[]>(() => {
        const records: WasteRecord[] = [];
        const today = new Date();
        const baseAmounts = [2, 0, 3, 1, 0, 4, 1, 0, 2, 0, 0, 1, 0, 5, 2, 0, 1, 1, 0, 3, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 2];
        const wasteCandidates = ["番茄", "雞蛋", "菠菜", "茄子", "牛奶", "牛肉", "蘋果", "優格"];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const amount = baseAmounts[i % baseAmounts.length];
            const items = amount > 0 
                ? Array.from({ length: amount }, () => wasteCandidates[Math.floor(Math.random() * wasteCandidates.length)])
                : [];

            records.push({
                date: `${y}-${m}-${day}`,
                amount: amount,
                items: items
            });
        }
        return records;
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("scannedIngredients");
        const savedRecs = localStorage.getItem("recommendedRecipes");
        const savedSettings = localStorage.getItem("appSettings");
        const savedBookmarked = localStorage.getItem("savedRecipes");
        const savedWaste = localStorage.getItem("wasteHistory");
        
        if (saved) try { setScannedItems(JSON.parse(saved)); } catch (e) { }
        if (savedRecs) try { setRecommendedRecipes(JSON.parse(savedRecs)); } catch (e) { }
        if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) { }
        if (savedBookmarked) try { setSavedRecipes(JSON.parse(savedBookmarked)); } catch (e) { }
        if (savedWaste) {
            try { 
                const parsed = JSON.parse(savedWaste);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setWasteHistory(parsed); 
                }
            } catch (e) { }
        }
    }, []);

    // Notification check effect
    useEffect(() => {
        if (settings.notifications && scannedItems.length > 0) {
            // 延遲一點執行，避免剛載入時太突兀
            const timer = setTimeout(() => {
                notificationService.checkAndNotify(scannedItems, settings);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [scannedItems, settings.notifications]);

    /** 同步狀態至本地端 localStorage，實現離線存取與關閉保留 (Data Persistence) */
    useEffect(() => {
        localStorage.setItem("scannedIngredients", JSON.stringify(scannedItems));
    }, [scannedItems]);

    useEffect(() => {
        localStorage.setItem("recommendedRecipes", JSON.stringify(recommendedRecipes));
    }, [recommendedRecipes]);

    useEffect(() => {
        localStorage.setItem("appSettings", JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem("savedRecipes", JSON.stringify(savedRecipes));
    }, [savedRecipes]);

    useEffect(() => {
        localStorage.setItem("wasteHistory", JSON.stringify(wasteHistory));
    }, [wasteHistory]);

    /**
     * 新增單一食材進入庫存
     */
    const addItem = (item: Partial<ScannedItem>) => {
        const now = Date.now();
        const uniqueId = item.id || `${now}-${Math.random().toString(36).substr(2, 9)}`;
        const newItem: ScannedItem = {
            id: uniqueId,
            name: item.name || "未知食材",
            quantity: item.quantity || 1,
            timestamp: item.timestamp || now,
            category: item.category || "其他",
            storageType: item.storageType || "fridge",
            expiryDays: item.expiryDays !== undefined ? item.expiryDays : 7, // Default 7 days
            ...item
        };

        // Don't add to main inventory if spoiled (or handle differently)
        // Here we add it but tag it as spoiled
        setScannedItems(prev => {
            const existing = prev.find(i => i.name.toLowerCase() === newItem.name.toLowerCase() && i.isSpoiled === newItem.isSpoiled && i.storageType === newItem.storageType);
            if (existing) {
                return prev.map(i =>
                    i.id === existing.id
                        ? { ...i, quantity: i.quantity + newItem.quantity, timestamp: now }
                        : i
                );
            }
            return [...prev, newItem];
        });

        // Update temp detections (real-time preview)
        setTempDetections(prev => {
            const existing = prev.find(i => i.name.toLowerCase() === newItem.name.toLowerCase() && i.isSpoiled === newItem.isSpoiled && i.storageType === newItem.storageType);
            if (existing) {
                return prev.map(i =>
                    i.id === existing.id
                        ? { ...i, quantity: i.quantity + newItem.quantity, timestamp: now }
                        : i
                );
            }
            return [...prev, newItem];
        });

        // Auto-select ONLY IF NOT SPOILED
        if (!newItem.isSpoiled) {
            setSelectedIds(prev => {
                const existingItem = scannedItems.find(i => i.name.toLowerCase() === newItem.name.toLowerCase() && i.isSpoiled === newItem.isSpoiled && i.storageType === newItem.storageType);
                const targetId = existingItem ? existingItem.id : uniqueId;
                return prev.includes(targetId) ? prev : [...prev, targetId];
            });
        }
    };

    const clearTempDetections = () => setTempDetections([]);

    const updateQuantity = (id: string, delta: number) => {
        const updater = (prev: ScannedItem[]) =>
            prev.map(item =>
                item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
            ).filter(item => item.quantity > 0);

        setScannedItems(updater);
        setTempDetections(updater);
    };

    const updateItem = (id: string, updates: Partial<ScannedItem>) => {
        setScannedItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
        setTempDetections(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const removeItem = (id: string) => {
        if (!id) return;
        
        const itemToRemove = scannedItems.find(i => i.id === id);
        
        if (itemToRemove) {
            const now = Date.now();
            const daysPassed = Math.floor((now - (itemToRemove.timestamp || now)) / (1000 * 60 * 60 * 24));
            const expiryDays = itemToRemove.expiryDays !== undefined ? itemToRemove.expiryDays : 7;
            const daysLeft = expiryDays - daysPassed;
            
            // 判定條件：已標記損壞、天數到期、或手動設為 0
            const isWaste = itemToRemove.isSpoiled || daysLeft <= 0 || expiryDays <= 0;
            
            if (isWaste) {
                setWasteHistory(prev => {
                    const today = new Date();
                    // 格式：YYYY-MM-DD (精確到本地日期)
                    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    
                    const newHistory = [...prev];
                    const existingIdx = newHistory.findIndex(h => h.date === dateStr);
                    
                    if (existingIdx !== -1) {
                        const existing = newHistory[existingIdx];
                        newHistory[existingIdx] = {
                            ...existing,
                            amount: (Number(existing.amount) || 0) + 1,
                            items: Array.from(new Set([...(existing.items || []), itemToRemove.name]))
                        };
                    } else {
                        newHistory.push({
                            date: dateStr,
                            amount: 1,
                            items: [itemToRemove.name]
                        });
                        newHistory.sort((a, b) => a.date.localeCompare(b.date));
                    }
                    return newHistory;
                });
            }
        }

        setScannedItems(prev => prev.filter(item => item.id !== id));
        setTempDetections(prev => prev.filter(item => item.id !== id));
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    };

    const removeIngredient = removeItem;

    const generateRecipe = async () => {
        const selectedIngredients = scannedItems
            .filter(item => selectedIds.includes(item.id) && !item.isSpoiled)
            .map(item => item.name);

        if (selectedIngredients.length === 0) {
            throw new Error("請選擇有效的食材進行合成（損壞食材將自動排除）");
        }

        const recipes = await llmService.generateRecipes({ ingredients: selectedIngredients });
        setRecommendedRecipes(recipes);
    };

    const toggleSelection = (id: string) => {
        const item = scannedItems.find(i => i.id === id);
        if (item?.isSpoiled) return; // Cannot select spoiled items
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const clearAll = () => {
        setScannedItems([]);
        setRecommendedRecipes([]);
        setTempDetections([]);
    };

    const updateSettings = (newSettings: Partial<{ notifications: boolean; neuralOptimized: boolean; confidenceThreshold: number }>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const saveRecipe = (recipe: any) => {
        setSavedRecipes(prev => {
            if (prev.find(r => r.id === recipe.id)) return prev;
            return [...prev, recipe];
        });
    };

    const unsaveRecipe = (recipeId: string) => {
        setSavedRecipes(prev => prev.filter(r => r.id !== recipeId));
    };

    return (
        <IngredientContext.Provider value={{
            scannedItems,
            recommendedRecipes,
            tempDetections,
            selectedIds,
            settings,
            wasteHistory,
            addItem,
            updateQuantity,
            updateItem,
            removeItem,
            removeIngredient,
            toggleSelection,
            generateRecipe,
            saveRecipe,
            unsaveRecipe,
            savedRecipes,
            clearAll,
            setRecipes: setRecommendedRecipes,
            clearTempDetections,
            updateSettings
        }}>
            {children}
        </IngredientContext.Provider>
    );
}

export function useIngredients() {
    const context = useContext(IngredientContext);
    if (context === undefined) {
        throw new Error("useIngredients must be used within an IngredientProvider");
    }
    return context;
}
