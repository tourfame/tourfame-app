import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Bell, BellOff, Trash2, CheckCheck } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from "wouter";
import PopupAd from "@/components/PopupAd";

export default function Notifications() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  // Fetch notifications top ads
  const { data: notificationsAds } = trpc.tours.getActiveAdsByPlacement.useQuery({ placement: "notifications_top", limit: 10 });
  
  // 同一位置多個廣告時隨機選擇一個顯示
  const randomAd = notificationsAds && notificationsAds.length > 0 
    ? notificationsAds[Math.floor(Math.random() * notificationsAds.length)] 
    : null;
  
  const { data: notifications, isLoading, refetch } = trpc.notifications.getNotifications.useQuery(
    { limit: 50 },
    { enabled: isAuthenticated }
  );
  
  const { data: unreadCount } = trpc.notifications.getUnreadCount.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已標記為已讀");
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已全部標記為已讀");
    },
  });

  const deleteNotificationMutation = trpc.notifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("已刪除通知");
    },
  });

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate({ notificationId });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (notificationId: number) => {
    deleteNotificationMutation.mutate({ notificationId });
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    // 如果是聯絡通知，跳轉到聯絡詳情頁面
    if (notification.type === "contact") {
      setLocation(`/contact/${notification.id}`);
    } else if (notification.tourId) {
      // 評價回覆/提問通知，跳轉到旅行團詳情頁面（帶上 reviewId 參數）
      if (notification.reviewId) {
        setLocation(`/tour/${notification.tourId}#review-${notification.reviewId}`);
      } else {
        setLocation(`/tour/${notification.tourId}`);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 container py-12">
          <div className="text-center">
            <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">請先登入</h2>
            <p className="text-muted-foreground mb-6">登入後即可查看您的回覆通知</p>
            <Button onClick={() => setLocation("/login")}>
              前往登入
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* 彈出式廣告 - 同一位置多個廣告時隨機顯示 */}
      {randomAd && (
        <PopupAd
          imageUrl={randomAd.imageUrl || ""}
          linkUrl={randomAd.linkUrl || ""}
          adId={randomAd.id}
          placement="notifications_top"
        />
      )}
      
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">回覆通知</h1>
              <p className="text-muted-foreground">
                {unreadCount ? `您有 ${unreadCount} 則未讀通知` : "暫無未讀通知"}
              </p>
            </div>
            {notifications && notifications.length > 0 && (
              <Button
                variant="outline"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                全部標記為已讀
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification: any) => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    notification.isRead ? "bg-background" : "bg-accent/10"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {notification.isRead ? (
                          <BellOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Bell className="h-4 w-4 text-primary" />
                        )}
                        <span className="font-medium">
                          {notification.type === "review_reply" ? "評價作者回覆了您" : notification.type === "contact" ? "提問" : "有人向您提問"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString("zh-TW", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        來自：{notification.fromUserName || notification.title || "未知用戶"}
                      </p>
                      {notification.type !== "contact" && notification.tourTitle && (
                        <p className="text-sm mb-2">
                          旅行團：{notification.tourTitle}
                        </p>
                      )}
                      <div className="bg-muted p-3 rounded-md">
                        <p className="text-sm">{notification.replyContent}</p>
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                        >
                          標記已讀
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">暫無通知</h3>
              <p className="text-muted-foreground">
                當有人回覆或提問您的評價時，您會在這裡收到通知
              </p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
