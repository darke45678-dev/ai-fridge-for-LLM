from ultralytics import YOLO
import os

def convert():
    model_path = "best.pt"
    output_dir = "public"
    
    if not os.path.exists(model_path):
        print(f"❌ 找不到 {model_path}，請確認檔案已上傳至專案根目錄。")
        return

    print(f"🔄 正在檢測到新權重: {model_path}，開始進行優化與轉換...")
    
    try:
        model = YOLO(model_path)
        
        # 進行導出
        # format="onnx": 網頁版需要的格式
        # imgsz=640: 配合目前前端的輸入大小
        # simplify=True: 移除冗餘算子，縮減體積並提升速度
        # opset=12: 確保相容於大部份瀏覽器的 ONNX Runtime
        print(f"🚀 正在導出至 ONNX 並執行模型簡化 (Simplify)...")
        exported_path = model.export(format="onnx", imgsz=640, simplify=True, opset=12)
        
        # 移動到 public 目錄
        target_path = os.path.join(output_dir, "best.onnx")
        if os.path.exists(target_path):
            os.remove(target_path)
            
        # YOLO export 會在同目錄生成 .onnx
        src_onnx = model_path.replace(".pt", ".onnx")
        if os.path.exists(src_onnx):
            os.rename(src_onnx, target_path)
            print(f"✨ 轉換完成！")
            print(f"📍 原始權重: {model_path}")
            print(f"📍 優化後 ONNX: {target_path}")
            print(f"💡 現在你可以直接在 App 中使用新的辨識能力了。")
        else:
            print(f"❌ 轉換後找不到生成的 onnx 檔案。")
            
    except Exception as e:
        print(f"❌ 轉換過程發生錯誤: {str(e)}")

if __name__ == "__main__":
    convert()
