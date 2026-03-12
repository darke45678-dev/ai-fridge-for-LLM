import { useNavigate } from "react-router";
import { ArrowLeft, Menu, Sparkles } from "lucide-react";
import { ReactNode } from "react";

// --- PageHeader ---
interface PageHeaderProps {
    showBackButton?: boolean; // 決定是否要顯示左側的「返回上一頁」箭頭，否則顯示漢堡選單圖示
    title?: string; // 頁面置中顯示的標題名稱
    rightAction?: ReactNode; // 右側自訂的按鈕或內容 (例如: 新增按鈕、設定按鈕等)
}

/**
 * 共用組件: 頁面頂部導覽列 (PageHeader)
 * 負責渲染每一個分頁最上方的導航區塊，支援毛玻璃透視效果與 sticky 固定置頂。
 * 
 * 作用：
 * 1. 提供統一的設計風格 (賽博龐克字體、加上綠色小星星)。
 * 2. 右側可插入自訂動作 (通過 `rightAction` 傳入)。
 * 3. 處理「上一頁」的返回邏輯，或是顯示選單圖示。
 */
export function PageHeader({ showBackButton = false, title = "KITCHEN AI", rightAction }: PageHeaderProps) {
    const navigate = useNavigate();

    return (
        <header className="flex items-center justify-between px-4 py-4 sticky top-0 bg-[#0f2e24]/80 backdrop-blur-md z-50">
            <div className="flex items-center gap-2">
                {showBackButton && (
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                )}
            </div>

            <h1 className="text-lg flex items-center gap-2 font-bold tracking-tight">
                <Sparkles size={20} className="text-[#00ff88]" />
                {title.toUpperCase()}
            </h1>

            <div className="flex items-center gap-2">
                {rightAction}
            </div>
        </header>
    );
}

// --- ImageWithFallback ---
// (We will add more shared components here as we find them)
