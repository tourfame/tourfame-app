import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

const categories = [
  { value: "all", label: "全部" },
  { value: "japan", label: "日本" },
  { value: "thailand", label: "泰國" },
  { value: "korea", label: "韓國" },
  { value: "taiwan", label: "台灣" },
  { value: "vietnam", label: "越南" },
  { value: "singapore", label: "新加坡" },
  { value: "malaysia", label: "馬來西亞" },
  { value: "indonesia", label: "印尼" },
  { value: "philippines", label: "菲律賓" },
  { value: "australia", label: "澳洲" },
  { value: "france", label: "法國" },
  { value: "uk", label: "英國" },
  { value: "italy", label: "意大利" },
  { value: "asia", label: "亞洲" },
  { value: "long_haul", label: "長線" },
  { value: "guangdong", label: "廣東省" },
  { value: "china_long_haul", label: "中國長線" },
];

export default function HeroSection() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState([0, 200000]);
  const [daysRange, setDaysRange] = useState([1, 14]);
  const [sortBy, setSortBy] = useState("rating_desc");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Real-time tour count
  const { data: tourCount } = trpc.tours.search.useQuery({
    keyword: searchQuery || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    minDays: daysRange[0],
    maxDays: daysRange[1],
    limit: 100,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
    }
    params.set("minPrice", priceRange[0].toString());
    params.set("maxPrice", priceRange[1].toString());
    params.set("minDays", daysRange[0].toString());
    params.set("maxDays", daysRange[1].toString());
    params.set("sortBy", sortBy);
    setLocation(`/tours?${params.toString()}`);
  };

  const handleClear = () => {
    setSearchQuery("");
    setPriceRange([0, 200000]);
    setDaysRange([1, 14]);
    setSortBy("rating_desc");
  };

  const getSortByLabel = (value: string) => {
    const labels: Record<string, string> = {
      rating_desc: "最高評分",
      price_asc: "最低價格",
      price_desc: "最高價格",
      newest: "最新發布",
    };
    return labels[value] || "最高評分";
  };

  return (
    <section className="relative min-h-[550px] md:min-h-[600px] flex items-center justify-center overflow-hidden py-4">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=2000')",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center text-white px-4">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 md:mb-4 animate-fade-in-up" style={{ lineHeight: '1.2' }}>
          探索理想的旅行團
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-4 md:mb-6 text-white/90 max-w-2xl mx-auto animate-fade-in-up animation-delay-200" style={{ lineHeight: '1.4', fontSize: '120%' }}>
          比較價格及評價，找你想的旅行團
        </p>

        {/* Search Bar with Filters */}
        <form
          onSubmit={handleSearch}
          className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-6 animate-fade-in-up animation-delay-400"
        >
          {/* Search Input */}
          <div className="flex items-center gap-2 px-4 py-3 bg-background rounded-lg mb-4">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="輸入目的地或旅行社名稱"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Collapsible Filter Section */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between px-4 py-3 bg-background rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="text-left">
                <div className="text-sm font-medium text-foreground">篩選條件</div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              )}
            </button>

            {/* Expanded Filter Content */}
            {isExpanded && (
              <div className="mt-4 space-y-6">
                {/* Price Range Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">
                      價格範圍: HK${priceRange[0]} - HK${priceRange[1].toLocaleString()}
                    </label>
                  </div>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={200000}
                    step={1000}
                    className="w-full"
                  />
                </div>

                {/* Days Range Slider */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">
                      天數: {daysRange[0]} - {daysRange[1]} 天
                    </label>
                  </div>
                  <Slider
                    value={daysRange}
                    onValueChange={setDaysRange}
                    min={1}
                    max={14}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Sort By Selector */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-foreground whitespace-nowrap">排序：</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="flex-1 bg-white text-black border-gray-300">
                      <SelectValue placeholder="選擇排序方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rating_desc">最高評分</SelectItem>
                      <SelectItem value="price_asc">最低價格</SelectItem>
                      <SelectItem value="price_desc">最高價格</SelectItem>
                      <SelectItem value="newest">最新發布</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          {/* Tour Count Display */}
          {isExpanded && (
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">
                找到 <span className="font-semibold text-foreground">{tourCount?.tours?.length || 0}</span> 個旅行團
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="submit"
              size="lg"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              套用篩選
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={handleClear}
              className="bg-white text-black border-gray-300 hover:bg-gray-50"
            >
              清除篩選
            </Button>
          </div>
        </form>


      </div>
    </section>
  );
}
