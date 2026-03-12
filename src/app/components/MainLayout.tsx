import { Outlet, useLocation, useNavigate } from "react-router";
import { BottomNav } from "../components/BottomNav";
import { motion, AnimatePresence } from "framer-motion";
import { useIngredients } from "../services/IngredientContext";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

/**
 * 主佈局組件 (Main Layout)
 * 這是整個應用的核心外框，所有分頁(Outlet)都會在這個佈局內被渲染。
 * 
 * 功能亮點：
 * 1. 控制全域主題：支援深色 (Dark) 與淺色 (Light) 主題切換 (雖然目前寫死深色賽博龐克為主)。
 * 2. 頁面轉場動畫：利用 `framer-motion` 在每次切換路徑 (Location.pathname) 時，產生平滑的左右滑動轉場過渡。
 * 3. 處理滑動手勢：監聽左右滑動 (`drag="x"`)，提供類原生 App 的左翻/右翻體驗。
 * 4. 系統級通知顯示：內建模擬的 `Toast` 系統，負責監聽並彈出「APP內的高能警告通知」。
 */
export function MainLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { settings } = useIngredients();

    // 定義可以讓使用者橫向滑動輪轉的主要功能分頁排序
    const tabs = ["/", "/inventory", "/recipes", "/saved", "/profile"];
    // 取得當下畫面處在哪一個分頁索引，用來計算左右切換的方向
    const currentIndex = tabs.findIndex(t => t === location.pathname || (t !== '/' && location.pathname.startsWith(t)));

    // 處理觸控滑動結束的核心邏輯
    const handleDragEnd = (_: any, info: { offset: { x: number } }) => {
        const threshold = 100; // 滑動距離超過 100 像素才觸發切換
        if (info.offset.x > threshold && currentIndex > 0) {
            navigate(tabs[currentIndex - 1]); // 往左翻
        } else if (info.offset.x < -threshold && currentIndex < tabs.length - 1 && currentIndex !== -1) {
            navigate(tabs[currentIndex + 1]); // 往右翻
        }
    };

    const [toast, setToast] = useState<{ title: string, body: string } | null>(null);

    useEffect(() => {
        const handleNotification = (e: any) => {
            setToast({ title: e.detail.title, body: e.detail.body });
            // 5秒後自動關閉
            setTimeout(() => {
                setToast(null);
            }, 5000);
        };
        window.addEventListener('app-notification', handleNotification);
        return () => window.removeEventListener('app-notification', handleNotification);
    }, []);

    return (
        <div className={`min-h-screen bg-black flex justify-center w-full ${!settings.darkMode ? 'light-theme' : ''}`}>
            <div className="w-full max-w-[430px] min-h-screen bg-[#0f2e24] text-white relative flex flex-col shadow-2xl overflow-hidden filter-theme">
                <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            onDragEnd={handleDragEnd}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="touch-pan-y min-h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
                <BottomNav />

                {/* 網頁內建模擬通知系統，保證能看到 (Cyberpunk 風格) */}
                <AnimatePresence>
                    {toast && (
                        <motion.div
                            initial={{ opacity: 0, y: -50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] z-[9999] pointer-events-none"
                        >
                            <div className="bg-[#1a4d3d]/90 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 shadow-[0_10px_40px_rgba(239,68,68,0.3)] flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 border border-red-500/50">
                                    <Bell size={18} className="text-red-500" />
                                </div>
                                <div>
                                    <h4 className="text-red-500 font-black text-[11px] tracking-widest uppercase mb-1 drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                                        {toast.title}
                                    </h4>
                                    <p className="text-xs text-white font-bold leading-relaxed">
                                        {toast.body}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
