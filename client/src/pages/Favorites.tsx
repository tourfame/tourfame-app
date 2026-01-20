import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { Loader2, Heart } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PopupAd from "@/components/PopupAd";

export default function Favorites() {
  const { user, isAuthenticated } = useAuth();
  
  // Fetch favorites
  const { data: favorites, isLoading, error, refetch } = trpc.tours.getUserFavorites.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  // Fetch popup ads
  const { data: favoriteAds } = trpc.tours.getActiveAdsByPlacement.useQuery({ placement: "favorites_top", limit: 10 });
  
  // 同一位置多個廣告時隨機選擇一個顯示
  const randomAd = favoriteAds && favoriteAds.length > 0 
    ? favoriteAds[Math.floor(Math.random() * favoriteAds.length)] 
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
          placement="favorites_top"
        />
      )}
      
      <main className="flex-1">
        {/* Header Section */}
        <section className="py-12 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="container">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-bold">我的收藏</h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              您收藏的旅行團將顯示在這裡，方便您隨時查看和比較
            </p>
          </div>
        </section>

        {/* Favorites Section */}
        <section className="py-16">
          <div className="container">
            {!isAuthenticated ? (
              // Not logged in
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <h2 className="text-2xl font-semibold mb-2">請先登入查看您的收藏</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  登入後，您可以收藏喜歡的旅行團，方便日後查看和比較
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
                <p className="text-destructive text-lg mb-2">載入收藏時發生錯誤</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            ) : !favorites || favorites.length === 0 ? (
              // No favorites
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mb-6" />
                <h2 className="text-2xl font-semibold mb-2">還沒有收藏任何旅行團</h2>
                <p className="text-muted-foreground mb-6 max-w-md">
                  開始探索旅行團，點擊心形圖標即可收藏您喜歡的行程
                </p>
                <Link href="/search">
                  <Button size="lg" onClick={() => window.scrollTo(0, 0)}>
                    探索旅行團
                  </Button>
                </Link>
              </div>
            ) : (
              // Display favorites
              <>
                <div className="mb-8">
                  <p className="text-muted-foreground">
                    您已收藏 <span className="font-semibold text-foreground">{favorites.length}</span> 個旅行團
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((favorite) => (
                    <TourCard
                      key={favorite.id}
                      tour={{
                        id: favorite.tourId!,
                        title: favorite.title!,
                        destination: favorite.destination!,
                        days: favorite.days!,
                        nights: favorite.nights!,
                        price: favorite.price!,
                        originalPrice: favorite.originalPrice,
                        departureDate: favorite.departureDate!,
                        imageUrl: favorite.imageUrl,
                        rating: favorite.rating,
                        reviewCount: favorite.reviewCount!,
                        isNoShopping: favorite.isNoShopping!,
                        isVerified: favorite.isVerified!,
                        agencyId: favorite.agencyId!,
                        agencyName: favorite.agencyName || undefined,
                      } as any}
                      onFavoriteChange={() => refetch()}
                    />
                  ))}
                </div>

                {/* Info Box */}
                <div className="mt-12 p-6 bg-secondary/30 rounded-lg">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Heart className="h-5 w-5 text-primary" />
                    收藏小貼士
                  </h3>
                  <p className="text-muted-foreground">
                    您可以隨時取消收藏不感興趣的旅行團。收藏的旅行團會影響我們為您提供的個性化推薦，
                    幫助您發現更多符合您喜好的行程！
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
