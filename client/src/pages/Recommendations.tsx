import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Star } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PopupAd from "@/components/PopupAd";

export default function Recommendations() {
  const { user, isAuthenticated } = useAuth();
  
  // Fetch recommendations
  const { data: recommendations, isLoading, error } = trpc.tours.getRecommendations.useQuery(
    { limit: 12 },
    { enabled: isAuthenticated }
  );
  
  // Fetch popup ads
  const { data: recommendationAds } = trpc.tours.getActiveAdsByPlacement.useQuery({ placement: "recommendations_top", limit: 10 });
  
  // 同一位置多個廣告時隨機選擇一個顯示
  const randomAd = recommendationAds && recommendationAds.length > 0 
    ? recommendationAds[Math.floor(Math.random() * recommendationAds.length)] 
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* 彈出式廣告 - 同一位置多個廣告時隨機顯示 */}
      {randomAd && (
        <PopupAd
          imageUrl={randomAd.imageUrl || ""}
          linkUrl={randomAd.linkUrl || ""}
          adId={randomAd.id}
          placement="recommendations_top"
        />
      )}
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="py-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="container">
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold">為你推薦</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              根據您的收藏和瀏覽記錄，我們為您精選了這些旅行團
            </p>
          </div>
        </section>

        {/* Recommendations Section */}
        <section className="py-16">
          <div className="container">
            {!isAuthenticated ? (
              // Not logged in
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h2 className="text-2xl font-semibold mb-2">請先登入查看您的推薦</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  登入後，我們會根據您的收藏和瀏覽歷史為您推薦最適合的旅行團
                </p>
                <Link href="/login">
                  <Button size="lg" onClick={() => window.scrollTo(0, 0)}>
                    登入
                  </Button>
                </Link>
              </div>
            ) : isLoading ? (
              // Loading
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              // Error
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-destructive text-lg mb-2">載入推薦時發生錯誤</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            ) : !recommendations || recommendations.length === 0 ? (
              // No recommendations
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="flex gap-4 mb-6">
                  <Star className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">還沒有足夠的數據</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  開始瀏覽和收藏旅行團，我們就能為您提供個性化推薦
                </p>
                <Link href="/search">
                  <Button size="lg" onClick={() => window.scrollTo(0, 0)}>
                    探索旅行團
                  </Button>
                </Link>
              </div>
            ) : (
              // Display recommendations
              <>
                <div className="mb-8">
                  <p className="text-muted-foreground">
                    為您找到 <span className="font-semibold text-foreground">{recommendations.length}</span> 個推薦旅行團
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.map((tour: any) => (
                    <TourCard key={tour.id} tour={tour} />
                  ))}
                </div>

                {/* Info Box */}
                <div className="mt-12 p-6 bg-secondary/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    推薦原理
                  </h3>
                  <p className="text-muted-foreground">
                    我們的推薦系統會分析您收藏和瀏覽過的旅行團，了解您偏好的目的地、旅行社和團型，
                    然後為您推薦相似但您尚未瀏覽過的旅行團。您的互動越多，推薦就越精準！
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
