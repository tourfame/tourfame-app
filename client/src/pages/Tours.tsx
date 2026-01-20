import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TourCard from "@/components/TourCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, SlidersHorizontal, X } from "lucide-react";
import { useLocation } from "wouter";
import PopupAd from "@/components/PopupAd";

export default function Tours() {
  const [location, setLocation] = useLocation();
  
  // Fetch featured tour ads
  const { data: featuredTourAds } = trpc.tours.getFeaturedTourAds.useQuery({ limit: 3 });
  const { data: searchAds } = trpc.tours.getActiveAdsByPlacement.useQuery({ placement: "search_top", limit: 10 });
  
  // 同一位置多個廣告時隨機選擇一個顯示
  const randomAd = searchAds && searchAds.length > 0 
    ? searchAds[Math.floor(Math.random() * searchAds.length)] 
    : null;
  const trackAdClickMutation = trpc.admin.trackAdClick.useMutation();

  const handleTourAdClick = (adId: number) => {
    trackAdClickMutation.mutate({ advertisementId: adId });
  };
  
  // Filter states
  // Support both 'q' (from hero search) and 'destination' (from filters)
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyId, setAgencyId] = useState<string | undefined>(undefined);
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [daysRange, setDaysRange] = useState([0, 14]);
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "rating_desc" | "popularity" | "most_liked">("rating_desc");
  const [showFilters, setShowFilters] = useState(false);

  // Initialize search query from URL params
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const queryFromUrl = searchParams.get("q") || searchParams.get("destination") || "";
    setSearchQuery(queryFromUrl);
  }, [location]);

  // Fetch agencies for filter
  const { data: agencies } = trpc.tours.getAgencies.useQuery();

  // Fetch tours with filters
  const { data, isLoading } = trpc.tours.search.useQuery({
    keyword: searchQuery || undefined,
    agencyId: agencyId ? Number(agencyId) : undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    minDays: daysRange[0],
    maxDays: daysRange[1],
    sortBy,
    limit: 100,
  });



  const clearFilters = () => {
    setSearchQuery("");
    setAgencyId(undefined);
    setPriceRange([0, 200000]);
    setDaysRange([1, 14]);
    setSortBy("rating_desc");
    setLocation("/tours");
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
          placement="search_top"
        />
      )}
      
      <main className="flex-1">
        {/* Hero Section with Background */}
        <div className="relative h-[300px] bg-cover bg-center mb-8"
          style={{
            backgroundImage: `url('/travel-background.png')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70" />
          <div className="relative container h-full flex flex-col justify-center">
            <h1 className="text-white mb-2">搜尋旅行團</h1>
            <p className="text-white/90">
              找到最適合您的旅程，比較價格和評價
            </p>
          </div>
        </div>
        
        <div className="container pb-8">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className={`lg:col-span-1 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-card rounded-lg p-6 sticky top-20">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">篩選條件</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-sm"
                  >
                    清除
                  </Button>
                </div>

                {/* Search Query */}
                <div className="mb-6">
                  <Label htmlFor="search" className="mb-2 block">目的地</Label>
                  <Input
                    id="search"
                    placeholder="輸入目的地或旅行社名稱"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
                  />
                </div>

                {/* Agency Filter */}
                <div className="mb-6">
                  <Label htmlFor="agency" className="mb-2 block">旅行社</Label>
                  <Select value={agencyId || "all"} onValueChange={(value) => setAgencyId(value === "all" ? undefined : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇旅行社" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      {agencies?.map((agency: any) => (
                        <SelectItem key={agency.id} value={agency.id.toString()}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <Label className="mb-2 block">
                    價格範圍: HK${priceRange[0].toLocaleString()} - HK${priceRange[1].toLocaleString()}
                  </Label>
                  <Slider
                    min={0}
                    max={200000}
                    step={500}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="mt-4"
                  />
                </div>

                {/* Days Range */}
                <div className="mb-6">
                  <Label className="mb-2 block">
                    天數: {daysRange[0]} - {daysRange[1]} 天
                  </Label>
                  <Slider
                    min={1}
                    max={14}
                    step={1}
                    value={daysRange}
                    onValueChange={setDaysRange}
                    className="mt-4"
                  />
                </div>

                {/* Results Count */}
                {data && (
                  <p className="text-sm text-muted-foreground mt-4">
                    找到 {data.total} 個旅行團
                  </p>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3">
              {/* Mobile Filter Toggle & Sort */}
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  篩選
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Label htmlFor="sort" className="text-sm">排序：</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger id="sort" className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating_desc">最高評分</SelectItem>
                      <SelectItem value="popularity">最受歡迎</SelectItem>
                      <SelectItem value="most_liked">最多讚好</SelectItem>
                      <SelectItem value="price_asc">價格由低至高</SelectItem>
                      <SelectItem value="price_desc">價格由高至低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tour Grid */}
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : data && data.tours.length > 0 ? (
                <>
                  {/* Featured Tour Ads */}
                  {featuredTourAds && featuredTourAds.length > 0 && (
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">推薦旅行團</h3>
                        <span className="text-xs text-muted-foreground">廣告</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 bg-primary/5 rounded-lg border-2 border-primary/20">
                        {featuredTourAds.map((item: any) => (
                          <div key={item.tour.id} onClick={() => handleTourAdClick(item.ad.id)}>
                            <TourCard tour={item.tour as any} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Tours */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.tours.map((tour) => (
                      <TourCard key={tour.id} tour={tour as any} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">
                    沒有找到符合條件的旅行團
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    清除篩選條件
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
