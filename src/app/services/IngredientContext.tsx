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
}

interface IngredientContextType {
    scannedItems: ScannedItem[];
    recommendedRecipes: any[];
    tempDetections: ScannedItem[];
    selectedIds: string[];
    settings: { notifications: boolean; darkMode: boolean };
    wasteHistory: WasteRecord[];
    addItem: (item: Partial<ScannedItem>) => void;
    updateQuantity: (id: string, delta: number) => void;
    updateItem: (id: string, updates: Partial<ScannedItem>) => void;
    removeItem: (id: string) => void;
    removeIngredient: (id: string) => void;
    toggleSelection: (id: string) => void;
    generateRecipe: () => Promise<void>;
    clearAll: () => void;
    setRecipes: (recipes: any[]) => void;
    clearTempDetections: () => void;
    updateSettings: (settings: Partial<{ notifications: boolean; darkMode: boolean }>) => void;
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
    const [settings, setSettings] = useState({ notifications: true, darkMode: true });

    // Mock 30 days of history
    const [wasteHistory] = useState<WasteRecord[]>(() => {
        const records: WasteRecord[] = [];
        const today = new Date();
        const baseAmounts = [2, 0, 3, 1, 0, 4, 1, 0, 2, 0, 0, 1, 0, 5, 2, 0, 1, 1, 0, 3, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 1, 2];

        for (let i = 29; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');

            // 使用一些假資料的規律，包含0、一些小浪費、偶爾較大浪費
            records.push({
                date: `${y}-${m}-${day}`,
                amount: baseAmounts[i % baseAmounts.length]
            });
        }
        return records;
    });

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("scannedIngredients");
        const savedRecipes = localStorage.getItem("recommendedRecipes");
        const savedSettings = localStorage.getItem("appSettings");
        if (saved) try { setScannedItems(JSON.parse(saved)); } catch (e) { }
        if (savedRecipes) try { setRecommendedRecipes(JSON.parse(savedRecipes)); } catch (e) { }
        if (savedSettings) try { setSettings(JSON.parse(savedSettings)); } catch (e) { }
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

    const updateSettings = (newSettings: Partial<{ notifications: boolean }>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
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
