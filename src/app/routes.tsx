import { createHashRouter } from "react-router";
import { MainLayout } from "./components/MainLayout";
import {
  Scanner,
  Ingredients,
  Recipes,
  RecipeDetail,
  Saved,
  Profile,
  Inventory
} from "./pages/Views";

/**
 * 系統路由器 (Router Configuration)
 * 定義了應用程式中所有的虛擬路徑 (URL Paths) 對應的 React 元件。
 * 
 * 優化說明：
 * - 移除舊版的 lazy loading (延遲加載)：因為所有視圖已整合在 `Views.tsx` 內，分別延遲加載無法進一步拆分 bundle，反而會造成頁面間平滑切換時產生無意義的 loading 畫面。改為直接引入能大幅提升前端體感流暢度。
 * - 使用 `createHashRouter`：確保在 GitHub Pages 等不支援單頁應用 (SPA) 後端回退機制的靜態伺服器上，網址重新整理時不會產生 404 錯誤。
 */
export const router = createHashRouter([
  {
    // 最上層的通用配置版型，它負責渲染上下邊界與轉場動畫
    path: "/",
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Scanner />, // 首頁預設：條碼/影像感測頁面
      },
      {
        path: "ingredients",
        element: <Ingredients />, // 單一食材與辨識細節
      },
      {
        path: "recipes",
        element: <Recipes />, // AI 食譜推薦清單
      },
      {
        path: "recipe/:id",
        element: <RecipeDetail />, // 特定食譜的詳細步驟
      },
      {
        path: "saved",
        element: <Saved />, // 全域保存庫與資料統計 (Data Statistics)
      },
      {
        path: "profile",
        element: <Profile />, // 使用者個人與系統設定
      },
      {
        path: "inventory",
        element: <Inventory />, // 食材庫存清單管理 (可切換冷藏/冷凍)
      },
    ],
  },
]);