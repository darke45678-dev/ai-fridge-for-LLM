/**
 * 工具函數: 格式化相對時間
 * 
 * 作用：
 * 將傳入的 UNIX Timestamp 轉換成人類易讀的相對時間格式，例如 "just now", "5m ago", "2d ago"。
 * 常被用於顯示「食材是多低掃描加入的」。
 * 
 * @param timestamp - 紀錄發生時的 Date.now() 數值
 * @returns {string} 格式化後的相對時間字串
 */
export function formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小時前`;
    if (minutes > 0) return `${minutes} 分鐘前`;
    if (seconds > 10) return `${seconds} 秒前`;
    return "剛剛";
}
