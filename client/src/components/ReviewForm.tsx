import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface ReviewFormProps {
  tourId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function ReviewForm({
  tourId,
  open,
  onOpenChange,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");


  const utils = trpc.useUtils();
  const createReviewMutation = trpc.tours.createReview.useMutation({
    onSuccess: () => {
      toast.success("評價已發布");
      // 刷新旅行團評分和評價列表
      utils.tours.getById.invalidate({ id: tourId });
      utils.tours.getTourReviews.invalidate({ tourId });
      utils.tours.search.invalidate();
      handleReset();
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(`發布失敗: ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error("請填寫評價內容");
      return;
    }

    if (content.length < 10) {
      toast.error("評價內容至少需要10個字");
      return;
    }

    createReviewMutation.mutate({
      tourId,
      rating,
      title: title.trim() || undefined,
      content: content.trim(),

    });
  };

  const handleReset = () => {
    setRating(5);
    setTitle("");
    setContent("");

  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>發布旅行團評價</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 評分 */}
          <div className="space-y-2">
            <Label>整體評分 *</Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {rating} 星
              </span>
            </div>
          </div>

          {/* 標題 */}
          <div className="space-y-2">
            <Label htmlFor="title">評價標題（可選）</Label>
            <Input
              id="title"
              placeholder="例如：超棒的日本之旅！"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <Label htmlFor="content">評價內容 *</Label>
            <Textarea
              id="content"
              placeholder="分享您的旅行體驗，至少10個字..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <div className="text-xs text-gray-500 text-right">
              {content.length} / 2000
            </div>
          </div>


        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createReviewMutation.isPending}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? "發布中..." : "發布評價"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
