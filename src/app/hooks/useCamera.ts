import { useEffect, useRef, useState } from "react";

/**
 * 自定義 Hook: useCamera
 * 負責管理裝置的攝影機，處理權限請求與影像串流。
 * 
 * 作用：
 * 1. 取得使用者的攝影機鏡頭（優先使用後置鏡頭 `facingMode: "environment"`）
 * 2. 將攝影機的影像串流 (MediaStream) 同步綁定到 HTMLVideoElement (videoRef) 上
 * 3. 處理權限被拒絕或無法讀取的錯誤狀態
 * 4. 組件卸載時，自動關閉所有影像軌道以釋放系統資源
 */
export function useCamera() {
    // 綁定到 <video> 標籤的參考點
    const videoRef = useRef<HTMLVideoElement>(null);
    // 儲存當前的影像串流軌道
    const streamRef = useRef<MediaStream | null>(null);
    // 錯誤狀態，如拒絕權限時會記錄錯誤訊息
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        /**
         * 非同步設置攝影機
         */
        async function setupCamera() {
            try {
                // 向瀏覽器請求視訊權限 (不要求聲音)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                    audio: false
                });
                streamRef.current = stream;

                // 將串流餵給 video 元素進行播放預覽
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            } catch (err) {
                console.error("無法存取攝影機:", err);
                setError("無法存取攝影機，請確認瀏覽器權限");
            }
        }

        setupCamera();

        // Cleanup: 當元件卸載或重新渲染時，關閉所有串流以停止鏡頭綠燈
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // 回傳給有需要的組件使用
    return { videoRef, error };
}
