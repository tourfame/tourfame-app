import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
// CommentSection removed
import {
  Loader2,
  Calendar,
  Users,
  MapPin,
  Star,
  Clock,
  ExternalLink,
  Heart,
  Share2,
  Phone,
  MessageSquare,
  FileText,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function TourDetail() {
  const [, params] = useRoute("/tour/:id");
  const tourId = params?.id ? parseInt(params.id) : 0;
  const { user } = useAuth();

  // Record view history
  const recordViewMutation = trpc.tours.recordViewHistory.useMutation();

  // Record view history when tour is loaded
  useEffect(() => {
    if (tourId > 0) {
      recordViewMutation.mutate({ tourId });
    }
  }, [tourId]);

  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const { data: tour, isLoading } = trpc.tours.getById.useQuery(
    { id: tourId },
    { enabled: tourId > 0 }
  );

  const { data: ratings, refetch: refetchRatings } = trpc.tours.getTourRatings.useQuery(
    { tourId },
    { enabled: tourId > 0 }
  );

  const { data: comments, refetch: refetchComments } = trpc.tours.getTourComments.useQuery(
    { tourId },
    { enabled: tourId > 0 }
  );

  const createRatingMutation = trpc.tours.createRating.useMutation({
    onSuccess: () => {
      toast.success("評分成功！");
      setShowRatingDialog(false);
      setSelectedRating(0);
      refetchRatings();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createCommentMutation = trpc.tours.createComment.useMutation({
    onSuccess: () => {
      toast.success("留言成功！");
      setShowCommentDialog(false);
      setCommentContent("");
      refetchComments();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteCommentMutation = trpc.tours.deleteComment.useMutation({
    onSuccess: () => {
      toast.success("留言刪除成功！");
      refetchComments();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleRatingClick = () => {
    if (!user) {
      toast.error("請先登入會員賬號使用此功能");
      return;
    }
    setShowRatingDialog(true);
  };

  const handleCommentClick = () => {
    if (!user) {
      toast.error("請先登入會員賬號使用此功能");
      return;
    }
    setShowCommentDialog(true);
  };

  const handleSubmitRating = () => {
    if (selectedRating === 0) {
      toast.error("請選擇評分");
      return;
    }
    createRatingMutation.mutate({
      tourId,
      rating: selectedRating,
    });
  };

  const handleSubmitComment = () => {
    if (!commentContent.trim()) {
      toast.error("請輸入留言內容");
      return;
    }
    createCommentMutation.mutate({
      tourId,
      content: commentContent,
      isAnonymous,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    if (confirm("確定要刪除這條留言嗎？")) {
      deleteCommentMutation.mutate({ commentId });
    }
  };

  // Calculate average rating
  const averageRating = ratings && ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
    : 0;

  const handleBooking = () => {
    if (tour?.affiliateLink) {
      // Track affiliate click here
      window.open(tour.affiliateLink, "_blank");
    } else {
      toast.error("預訂連結暫時無法使用");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tour?.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("連結已複製到剪貼板");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!tour) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">找不到旅行團</h2>
            <p className="text-muted-foreground">此旅行團可能已下架或不存在</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price: string) => {
    return `HK$${parseFloat(price).toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero Image */}
        <div className="relative h-[400px] bg-cover bg-center"
          style={{
            backgroundImage: `url('/travel-background.png')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container">
              <div className="flex flex-wrap gap-2 mb-4">
                {tour.isNoShopping && (
                  <Badge className="bg-accent text-accent-foreground">無購物</Badge>
                )}
                {tour.isVerified && (
                  <Badge className="bg-primary text-primary-foreground">已驗證</Badge>
                )}
              </div>
              <h1 className="text-white mb-2 text-xl md:text-2xl lg:text-3xl">{tour.title}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-1">
                  <MapPin className="h-5 w-5" />
                  <span>{tour.destination}</span>
                </div>
                {(tour.days > 0 || tour.nights > 0) && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5" />
                    <span>
                      {tour.days > 0 && `${tour.days}日`}
                      {tour.nights > 0 && `${tour.nights}夜`}
                    </span>
                  </div>
                )}
                {tour.rating && parseFloat(tour.rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span>{parseFloat(tour.rating).toFixed(1)} ({tour.reviewCount})</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="container py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reviews Section - No Tabs */}
              <div className="space-y-6">
                {/* Hidden Itinerary Tab Content - Removed from UI */}
                <div className="hidden">
                  {/* Highlights */}
                  <Card>
                    <CardHeader>
                      <CardTitle>行程亮點</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.highlights ? (
                        <div className="prose max-w-none">
                          <p className="whitespace-pre-wrap">{tour.highlights}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-4">暫無行程亮點資訊</p>
                          {tour.sourceUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(tour.sourceUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              前往旅行社網站查看
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Itinerary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>詳細行程</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.itinerary ? (
                        <div className="prose max-w-none">
                          <p className="whitespace-pre-wrap">{tour.itinerary}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-4">暫無詳細行程資訊</p>
                          {tour.sourceUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(tour.sourceUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              前往旅行社網站查看
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Inclusions & Exclusions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">費用包含</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tour.inclusions ? (
                          <p className="whitespace-pre-wrap text-sm">{tour.inclusions}</p>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            <p className="mb-2">暫無費用包含資訊</p>
                            {tour.sourceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(tour.sourceUrl!, "_blank")}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                查看詳情
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">費用不包含</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {tour.exclusions ? (
                          <p className="whitespace-pre-wrap text-sm">{tour.exclusions}</p>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            <p className="mb-2">暫無費用不包含資訊</p>
                            {tour.sourceUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(tour.sourceUrl!, "_blank")}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                查看詳情
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Hotels */}
                  <Card>
                    <CardHeader>
                      <CardTitle>住宿安排</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.hotels ? (
                        <p className="whitespace-pre-wrap">{tour.hotels}</p>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-4">暫無住宿安排資訊</p>
                          {tour.sourceUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(tour.sourceUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              前往旅行社網站查看
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Meals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>餐食安排</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {tour.meals ? (
                        <p className="whitespace-pre-wrap">{tour.meals}</p>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-4">暫無餐食安排資訊</p>
                          {tour.sourceUrl && (
                            <Button
                              variant="outline"
                              onClick={() => window.open(tour.sourceUrl!, "_blank")}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              前往旅行社網站查看
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Reviews Section */}
                <div className="space-y-6">
                  {/* Rating Statistics */}
                  {ratings && ratings.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>評分統計</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-primary">
                                {averageRating.toFixed(1)}
                              </div>
                              <div className="flex items-center justify-center mt-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {ratings.length} 個評分
                              </div>
                            </div>
                            <div className="flex-1 space-y-2">
                              {[5, 4, 3, 2, 1].map((star) => {
                                const count = ratings.filter((r) => r.rating === star).length;
                                const percentage = ratings.length > 0 ? (count / ratings.length) * 100 : 0;
                                return (
                                  <div key={star} className="flex items-center gap-2">
                                    <span className="text-sm w-8">{star}星</span>
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-yellow-400 transition-all"
                                        style={{ width: `${percentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm text-muted-foreground w-12 text-right">
                                      {count}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Review List with Button */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-2xl font-bold">用戶評價</h2>
                      <Button onClick={() => {
                        if (!user) {
                          // Redirect to login with return path
                          const returnTo = encodeURIComponent(`/tour/${tourId}#reviews`);
                          window.location.href = `/login?returnTo=${returnTo}`;
                          return;
                        }
                        setShowReviewForm(true);
                      }}>
                        <Star className="w-4 h-4 mr-2" />
                        發布評價
                      </Button>
                    </div>
                    <ReviewList tourId={tourId} />
                  </div>


                </div>
              </div>
            </div>

            {/* Sidebar - Removed */}
          </div>
        </div>

        {/* Review Form Dialog */}
        <ReviewForm
          tourId={tourId}
          open={showReviewForm}
          onOpenChange={setShowReviewForm}
          onSuccess={() => {
            // Refresh review list after successful submission
          }}
        />
      </main>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>評分旅行團</DialogTitle>
            <DialogDescription>選擇您的評分（1-5星）</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-2 py-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= selectedRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRatingDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitRating} disabled={createRatingMutation.isPending}>
              {createRatingMutation.isPending ? "提交中..." : "提交"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={(open) => {
        setShowCommentDialog(open);
        if (!open) {
          setIsAnonymous(false);
          setCommentContent("");
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>留言</DialogTitle>
            <DialogDescription>分享您的旅遊體驗</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="請輸入您的留言..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            rows={5}
            maxLength={1000}
          />
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="anonymous" className="text-sm text-muted-foreground">
              匿名留言（不顯示用戶名稱）
            </label>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitComment} disabled={createCommentMutation.isPending}>
              {createCommentMutation.isPending ? "提交中..." : "提交"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
