import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface PopupAdProps {
  imageUrl: string;
  linkUrl: string;
  adId: number;
  placement: string;
}

export default function PopupAd({ imageUrl, linkUrl, adId, placement }: PopupAdProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 檢查是否已經顯示過這個廣告（使用 localStorage）
    const storageKey = `ad_shown_${placement}_${adId}`;
    const hasShown = localStorage.getItem(storageKey);

    if (!hasShown) {
      // 延遲 1 秒後顯示廣告
      const timer = setTimeout(() => {
        setOpen(true);
        // 標記為已顯示
        localStorage.setItem(storageKey, "true");
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [adId, placement]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleAdClick = () => {
    // 打開新窗口跳轉
    window.open(linkUrl, "_blank", "noopener,noreferrer");
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
        {/* 廣告標籤 */}
        <div className="absolute top-3 left-3 z-10 bg-black/70 text-white px-3 py-1 rounded text-sm font-medium">
          廣告
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors shadow-lg"
          aria-label="關閉廣告"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>

        {/* 廣告圖片 */}
        <div
          onClick={handleAdClick}
          className="cursor-pointer relative"
        >
          <img
            src={imageUrl}
            alt="廣告"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
