import { useState } from "react";
import { MessageCircle, Trash2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Comment {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  content: string;
  createdAt: Date;
  isAnonymous: boolean;
}

interface CommentSectionProps {
  tourId: number;
}

export default function CommentSection({ tourId }: CommentSectionProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [newComment, setNewComment] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: comments = [], isLoading } = trpc.tours.getTourComments.useQuery({ tourId });

  const createCommentMutation = trpc.tours.createComment.useMutation({
    onSuccess: () => {
      toast.success("留言已發布");
      setNewComment("");
      setIsAnonymous(false);
      utils.tours.getTourComments.invalidate({ tourId });
    },
    onError: (error) => {
      toast.error(`發布失敗：${error.message}`);
    },
  });

  const deleteCommentMutation = trpc.tours.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("留言已刪除");
      utils.tours.getTourComments.invalidate({ tourId });
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("請先登入");
      return;
    }

    if (!newComment.trim()) {
      toast.error("請填寫留言內容");
      return;
    }

    if (newComment.length > 500) {
      toast.error("留言內容不能超過500字");
      return;
    }

    createCommentMutation.mutate({
      tourId,
      content: newComment.trim(),
      isAnonymous,
    });
  };

  const handleDelete = (commentId: number) => {
    if (confirm("確定要刪除這則留言嗎？")) {
      deleteCommentMutation.mutate({ commentId });
    }
  };

  // Format time with relative and absolute time
  const formatCommentTime = (date: Date) => {
    const commentDate = new Date(date);
    const relativeTime = formatDistanceToNow(commentDate, { addSuffix: true, locale: zhTW });
    const absoluteTime = format(commentDate, "yyyy年MM月dd日 HH:mm", { locale: zhTW });
    return { relativeTime, absoluteTime };
  };

  // Get display name based on anonymous setting
  const getDisplayName = (comment: Comment) => {
    if (comment.isAnonymous) {
      return "匿名用戶";
    }
    return comment.userName || comment.userEmail?.split("@")[0] || "用戶";
  };

  // Get avatar initial
  const getAvatarInitial = (comment: Comment) => {
    if (comment.isAnonymous) {
      return "匿";
    }
    const name = comment.userName || comment.userEmail?.split("@")[0] || "U";
    return name[0].toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5" />
        <h3 className="text-lg font-semibold">留言討論</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {/* 留言輸入框 */}
      {user ? (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="分享您的想法或提問..."
              rows={3}
              maxLength={500}
              className="resize-none"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="anonymous-comment"
                checked={isAnonymous}
                onCheckedChange={(checked) => setIsAnonymous(checked === true)}
              />
              <label
                htmlFor="anonymous-comment"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                匿名留言（不顯示用戶名稱）
              </label>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {newComment.length}/500
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={createCommentMutation.isPending || !newComment.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                {createCommentMutation.isPending ? "發布中..." : "發布留言"}
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="p-4 text-center">
          <p className="text-muted-foreground mb-3">請先登入以發表留言</p>
          <Button size="sm" onClick={() => window.location.href = "/login"}>
            前往登入
          </Button>
        </Card>
      )}

      {/* 留言列表 - 最新的排在最上方 */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">載入中...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>還沒有留言</p>
          <p className="text-sm mt-1">成為第一個留言的人！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment: Comment) => {
            const { relativeTime, absoluteTime } = formatCommentTime(comment.createdAt);
            return (
              <Card key={comment.id} className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      comment.isAnonymous ? "bg-gray-200" : "bg-primary/10"
                    }`}>
                      <span className={`text-sm font-semibold ${
                        comment.isAnonymous ? "text-gray-500" : "text-primary"
                      }`}>
                        {getAvatarInitial(comment)}
                      </span>
                    </div>
                    <div>
                      <p className={`font-medium text-sm ${
                        comment.isAnonymous ? "text-gray-500" : ""
                      }`}>
                        {getDisplayName(comment)}
                      </p>
                      <p className="text-xs text-muted-foreground" title={absoluteTime}>
                        {relativeTime} · {absoluteTime}
                      </p>
                    </div>
                  </div>
                  {user && user.id === comment.userId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deleteCommentMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-foreground whitespace-pre-wrap pl-10">{comment.content}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
