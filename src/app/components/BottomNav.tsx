import { Camera, Sparkles, BookOpen, User, Package } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

/**
 * BottomNav (底部導覽列組件)
 * 負責在整個應用程式下方渲染五個主要分頁的切換按鈕。
 * 
 * 功能亮點：
 * 1. 使用 `react-router` 的 `useLocation` 及 `useNavigate` 判斷當前所在路徑與執行跳轉。
 * 2. 結合賽博龐克主題風格的 UI，點擊時會具備發光 (`#00ff88`) 與縮放動畫。
 * 3. 處理手機版友善的安全邊距，將其浮動在畫面的最下層並加上玻璃透視背景 (backdrop-blur)。
 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // 定義導覽列的每個標籤、圖標元件以及對應的路由路徑
  const navItems = [
    { icon: Camera, label: "掃描", path: "/" },
    { icon: Package, label: "冰箱", path: "/inventory" },
    { icon: Sparkles, label: "AI食譜", path: "/recipes" },
    { icon: BookOpen, label: "紀錄", path: "/saved" },
    { icon: User, label: "我的", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[430px] px-4 pb-6 pt-2 pointer-events-none">
      <div className="w-full mx-auto bg-[#0f2e24]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
        {/* 動態渲染導覽清單項目 */}
        {navItems.map((item) => {
          const Icon = item.icon;
          // 判斷按鈕是否處於「啟動/當前」狀態，針對根目錄 (/) 特別處理精確匹配
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-1.5 px-5 py-2.5 rounded-2xl transition-all duration-300 group ${isActive ? "text-[#00ff88]" : "text-gray-500 hover:text-white"
                }`}
            >
              {/* 如果正在該分頁內，顯示微微的背景綠色光暈 */}
              {isActive && (
                <div className="absolute inset-0 bg-[#00ff88]/5 rounded-2xl animate-in fade-in zoom-in duration-300" />
              )}
              {/* 按鈕圖示 (Lucide React) */}
              <Icon size={20} strokeWidth={isActive ? 3 : 2} className="relative z-10" />
              {/* 按鈕下方文字標籤 (利用 Tailwind opacity 隱藏/顯示作過渡效果) */}
              <span className={`text-[8px] font-black tracking-[0.2em] relative z-10 transition-all ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1 group-hover:opacity-40"}`}>
                {item.label}
              </span>
              {/* 當前頁面的高亮霓虹光點指示器 */}
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#00ff88] rounded-full shadow-[0_0_8px_#00ff88]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}