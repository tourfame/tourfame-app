
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeroSection from "@/components/HeroSection";
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, ShieldCheck } from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PopupAd from "@/components/PopupAd";







export default function Home() {
  const [, setLocation] = useLocation();
  const { data: featuredAgencies } = trpc.tours.getFeaturedAgencyAds.useQuery({ limit: 6 });
  const { data: homeAds } = trpc.tours.getActiveAdsByPlacement.useQuery({ placement: "home_top", limit: 10 });
  const trackAdClickMutation = trpc.admin.trackAdClick.useMutation();
  
  // 同一位置多個廣告時隨機選擇一個顯示
  const randomAd = homeAds && homeAds.length > 0 
    ? homeAds[Math.floor(Math.random() * homeAds.length)] 
    : null;

  const handleAgencyAdClick = (adId: number) => {
    trackAdClickMutation.mutate({ advertisementId: adId });
  };


  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      {/* 彈出式廣告 - 同一位置多個廣告時隨機顯示 */}
      {randomAd && (
        <PopupAd
          imageUrl={randomAd.imageUrl || ""}
          linkUrl={randomAd.linkUrl || ""}
          adId={randomAd.id}
          placement="home_top"
        />
      )}
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />




        {/* Featured Agencies Section */}
        {featuredAgencies && featuredAgencies.length > 0 && (
          <section className="py-16 bg-background">
            <div className="container">
              <h2 className="text-3xl font-bold text-center mb-12">精選旅行社</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {featuredAgencies.map((item: any) => (
                  <div
                    key={item.agency.id}
                    className="flex flex-col items-center p-4 rounded-lg border bg-card hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      handleAgencyAdClick(item.ad.id);
                      setLocation(`/tours?agency=${item.agency.id}`);
                      window.scrollTo(0, 0);
                    }}
                  >
                    {item.agency.logoUrl ? (
                      <img
                        src={item.agency.logoUrl}
                        alt={item.agency.name}
                        className="w-16 h-16 object-contain mb-2"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                        <span className="text-2xl font-bold text-primary">
                          {item.agency.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <p className="text-sm font-medium text-center">{item.agency.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Section - Moved before CTA */}
        <section className="py-16 bg-secondary/30">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">即時價格比較</h3>
                <p className="text-muted-foreground">
                  比較多家旅行社價格，找到最優惠的旅行團方案
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">真實用戶評價</h3>
                <p className="text-muted-foreground">
                  查看經過驗證的真實評價，做出明智選擇
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container text-center">
            <h2 className="text-white mb-4">準備好開始您的旅程了嗎？</h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              立即搜尋並比較數百個旅行團，找到最適合您的完美行程
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => { 
                setLocation("/tours"); 
                window.scrollTo(0, 0); 
              }}
            >
              立即搜尋旅行團
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
