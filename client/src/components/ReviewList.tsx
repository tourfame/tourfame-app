import { useState } from "react";
import { Star, ThumbsUp, Trash2, MessageCircle, Reply, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface Review {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string | null;
  rating: number;
  title: string | null;
  content: string;
  photos: string[] | null;
  isVerified: boolean;
  travelDate: Date | null;
  helpfulCount: number;
  replyCount: number;
  createdAt: Date;
}

interface ReviewListProps {
  tourId: number;
}

export default function ReviewList({ tourId }: ReviewListProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const [expandedReviewId, setExpandedReviewId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: number]: string }>({});
  
  const { data: reviews = [], isLoading } = trpc.tours.getTourReviews.useQuery({ tourId });
  
  const deleteReviewMutation = trpc.tours.deleteReview.useMutation({
    onSuccess: () => {
      toast.success("評價已刪除");
      utils.tours.getTourReviews.invalidate({ tourId });
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const markHelpfulMutation = trpc.tours.markReviewHelpful.useMutation({
    onSuccess: () => {
      toast.success("已讚好");
      utils.tours.getTourReviews.invalidate({ tourId });
    },
    onError: (error) => {
      toast.error(`操作失敗：${error.message}`);
    },
  });

  const createReplyMutation = trpc.tours.createReviewReply.useMutation({
    onSuccess: () => {
      toast.success("回覆已發布");
      utils.tours.getReviewReplies.invalidate();
      utils.tours.getTourReviews.invalidate({ tourId });
      setReplyContent({});
      setExpandedReviewId(null);
    },
    onError: (error) => {
      toast.error(`發布失敗：${error.message}`);
    },
  });

  const deleteReplyMutation = trpc.tours.deleteReviewReply.useMutation({
    onSuccess: () => {
      toast.success("回覆已刪除");
      utils.tours.getReviewReplies.invalidate();
      utils.tours.getTourReviews.invalidate({ tourId });
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const handleDelete = (reviewId: number) => {
    if (confirm("確定要刪除這則評價嗎？")) {
      deleteReviewMutation.mutate({ reviewId });
    }
  };

  const handleMarkHelpful = (reviewId: number) => {
    markHelpfulMutation.mutate({ reviewId });
  };

  const handleToggleReplies = (reviewId: number) => {
    if (expandedReviewId === reviewId) {
      setExpandedReviewId(null);
    } else {
      setExpandedReviewId(reviewId);
    }
  };

  const handleSubmitReply = (reviewId: number) => {
    const content = replyContent[reviewId]?.trim();
    if (!content) {
      toast.error("請輸入回覆內容");
      return;
    }

    createReplyMutation.mutate({
      reviewId,
      content,
    });
  };

  const handleDeleteReply = (replyId: number) => {
    if (confirm("確定要刪除這則回覆嗎？")) {
      deleteReplyMutation.mutate({ replyId });
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">載入中...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>目前還沒有評價</p>
        <p className="text-sm mt-2">成為第一個分享旅遊體驗的人！</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review: Review) => (
        <ReviewCard
          key={review.id}
          review={review}
          user={user}
          expandedReviewId={expandedReviewId}
          replyContent={replyContent}
          setReplyContent={setReplyContent}
          handleDelete={handleDelete}
          handleMarkHelpful={handleMarkHelpful}
          handleToggleReplies={handleToggleReplies}
          handleSubmitReply={handleSubmitReply}
          handleDeleteReply={handleDeleteReply}
          deleteReviewMutation={deleteReviewMutation}
          markHelpfulMutation={markHelpfulMutation}
          createReplyMutation={createReplyMutation}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  user,
  expandedReviewId,
  replyContent,
  setReplyContent,
  handleDelete,
  handleMarkHelpful,
  handleToggleReplies,
  handleSubmitReply,
  handleDeleteReply,
  deleteReviewMutation,
  markHelpfulMutation,
  createReplyMutation,
}: any) {
  const { data: replies = [] } = trpc.tours.getReviewReplies.useQuery(
    { reviewId: review.id },
    { enabled: expandedReviewId === review.id }
  );

  const isAuthor = user && user.id === review.userId;
  const hasReplies = review.replyCount > 0;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">
              {review.userName || review.userEmail?.split("@")[0] || "匿名用戶"}
            </span>
            {review.isVerified && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                已驗證
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < review.rating
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(review.createdAt), "yyyy年MM月dd日", { locale: zhTW })}
            {review.travelDate && (
              <span className="ml-2">
                · 旅遊日期：{format(new Date(review.travelDate), "yyyy年MM月", { locale: zhTW })}
              </span>
            )}
          </p>
        </div>
        {isAuthor && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(review.id)}
            disabled={deleteReviewMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      {review.title && (
        <h4 className="font-semibold mb-2">{review.title}</h4>
      )}

      <p className="text-foreground mb-4 whitespace-pre-wrap">{review.content}</p>

      {review.photos && Array.isArray(review.photos) && review.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {review.photos.map((photo: string, index: number) => (
            <img
              key={index}
              src={photo}
              alt={`評價照片 ${index + 1}`}
              className="w-full h-32 object-cover rounded"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-4 border-t flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleMarkHelpful(review.id)}
          disabled={markHelpfulMutation.isPending}
          className="text-muted-foreground hover:text-foreground"
        >
          <ThumbsUp className="w-4 h-4 mr-1" />
          讚好 ({review.helpfulCount})
        </Button>
        
        {/* 提問/回覆按鈕 */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleReplies(review.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isAuthor ? (
              <>
                <Reply className="w-4 h-4 mr-1" />
                回覆 ({review.replyCount})
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-1" />
                提問 ({review.replyCount})
              </>
            )}
          </Button>
        )}
      </div>

      {/* 回覆區域 */}
      {expandedReviewId === review.id && (
        <div className="mt-4 pt-4 border-t space-y-4">
          {/* 顯示現有回覆 */}
          {replies.length > 0 && (
            <div className="space-y-3">
              {replies.map((reply: any) => (
                <div
                  key={reply.id}
                  className={`p-3 rounded-lg ${
                    reply.isAuthorReply
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {reply.userName || reply.userEmail?.split("@")[0] || "匿名用戶"}
                      </span>
                      {reply.isAuthorReply && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          作者
                        </span>
                      )}
                    </div>
                    {user && user.id === reply.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteReply(reply.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(reply.createdAt), "yyyy年MM月dd日 HH:mm", { locale: zhTW })}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 回覆輸入框 */}
          <div className="space-y-2">
            <Textarea
              placeholder={isAuthor ? "回覆其他用戶的提問..." : "向作者提問..."}
              value={replyContent[review.id] || ""}
              onChange={(e) =>
                setReplyContent({ ...replyContent, [review.id]: e.target.value })
              }
              className="min-h-[80px]"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleReplies(review.id)}
              >
                取消
              </Button>
              <Button
                size="sm"
                onClick={() => handleSubmitReply(review.id)}
                disabled={createReplyMutation.isPending || !replyContent[review.id]?.trim()}
              >
                <Send className="w-4 h-4 mr-1" />
                {createReplyMutation.isPending ? "發布中..." : "發布"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
