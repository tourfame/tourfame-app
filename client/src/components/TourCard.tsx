import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Calendar, Users, Heart, Phone, ExternalLink, FileText, ThumbsUp, MessageCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import type { Tour } from "../../../drizzle/schema";

interface TourCardProps {
  tour: Tour & {
    agencyName?: string | null;
    agencyLogoUrl?: string | null;
    agencyWhatsapp?: string | null;
    agencyPhone?: string | null;
    imageUrl?: string | null;
    sourceUrl?: string | null;
    category?: string | null;
    tags?: string[];
    ratingCount?: number;
    commentCount?: number;
  };
  onFavoriteChange?: () => void;
}

export default function TourCard({ tour, onFavoriteChange }: TourCardProps) {
  const utils = trpc.useUtils();
  
  // Check if tour is favorited
  const { data: favoriteData } = trpc.tours.checkIsFavorited.useQuery(
    { tourId: tour.id },
    { enabled: !!tour.id }
  );
  const isFavorited = favoriteData?.isFavorited || false;

  // Add to favorites
  const addFavoriteMutation = trpc.tours.addFavorite.useMutation({
    onSuccess: () => {
      toast.success("已加入收藏");
      utils.tours.checkIsFavorited.invalidate({ tourId: tour.id });
      utils.tours.getUserFavorites.invalidate();
      onFavoriteChange?.();
    },
    onError: (error) => {
      toast.error(error.message || "收藏失敗");
    },
  });

  // Remove from favorites
  const removeFavoriteMutation = trpc.tours.removeFavorite.useMutation({
    onSuccess: () => {
      toast.success("已取消收藏");
      utils.tours.checkIsFavorited.invalidate({ tourId: tour.id });
      utils.tours.getUserFavorites.invalidate();
      onFavoriteChange?.();
    },
    onError: (error) => {
      toast.error(error.message || "取消收藏失敗");
    },
  });

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorited) {
      removeFavoriteMutation.mutate({ tourId: tour.id });
    } else {
      addFavoriteMutation.mutate({ tourId: tour.id });
    }
  };
  const formatPrice = (price: string) => {
    return `HK$${parseFloat(price).toLocaleString()}`;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-HK", {
      month: "short",
      day: "numeric",
    });
  };

  // 根據目的地智能匹配圖片
  const getImageUrl = (destination: string, imageUrl?: string | null) => {
    // 如果已有圖片 URL，直接使用
    if (imageUrl) return imageUrl;

    const dest = destination.toLowerCase();

    // 日本
    if (dest.includes('日本') || dest.includes('japan') || dest.includes('東京') || dest.includes('大阪') || dest.includes('京都') || dest.includes('北海道') || dest.includes('沖繩')) {
      return '/tour-images/japan.png';
    }

    // 歐洲
    if (dest.includes('歐洲') || dest.includes('法國') || dest.includes('英國') || dest.includes('意大利') || dest.includes('澳洲') || dest.includes('長線') || dest.includes('europe') || dest.includes('france') || dest.includes('uk') || dest.includes('italy') || dest.includes('australia')) {
      return '/tour-images/europe.png';
    }

    // 亞洲其他國家
    if (dest.includes('泰國') || dest.includes('韓國') || dest.includes('印尼') || dest.includes('馬來西亞') || dest.includes('越南') || dest.includes('新加坡') || dest.includes('亞洲') || dest.includes('台灣') || dest.includes('菲律賓') || dest.includes('thailand') || dest.includes('korea') || dest.includes('indonesia') || dest.includes('malaysia') || dest.includes('vietnam') || dest.includes('singapore') || dest.includes('taiwan') || dest.includes('philippines')) {
      return '/tour-images/asia.png';
    }

    // 中國
    if (dest.includes('中國') || dest.includes('廣東') || dest.includes('china') || dest.includes('guangdong') || dest.includes('北京') || dest.includes('上海') || dest.includes('西安') || dest.includes('成都') || dest.includes('雲南') || dest.includes('四川') || dest.includes('貴州') || dest.includes('哈爾濱') || dest.includes('長白山') || dest.includes('吉林') || dest.includes('大連') || dest.includes('青島') || dest.includes('山東') || dest.includes('惠州')) {
      return '/tour-images/china.png';
    }

    // 默認圖片
    return '/tour-background.jpg';
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category) return null;
    const labels: Record<string, string> = {
      japan: "日本",
      thailand: "泰國",
      korea: "韓國",
      taiwan: "台灣",
      vietnam: "越南",
      singapore: "新加坡",
      malaysia: "馬來西亞",
      indonesia: "印尼",
      philippines: "菲律賓",
      australia: "澳洲",
      france: "法國",
      uk: "英國",
      italy: "意大利",
      asia: "亞洲",
      long_haul: "長線",
      guangdong: "廣東省",
      china_long_haul: "中國長線",
    };
    return labels[category] || category;
  };

  return (
    <Card className="overflow-hidden card-hover group">
      <div className="relative h-48 overflow-hidden">
        {/* Tour image or placeholder */}
        <div
          className="w-full h-full bg-cover bg-center transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundImage: `url('${getImageUrl(tour.destination, tour.imageUrl)}')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteToggle}
          disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 hover:bg-white transition-colors disabled:opacity-50"
          aria-label={isFavorited ? "取消收藏" : "收藏"}
        >
          <Heart
            className={`h-5 w-5 ${
              isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
            }`}
          />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-3">
          {tour.category && (
            <Badge variant="secondary">{getCategoryLabel(tour.category)}</Badge>
          )}
        </div>

        {/* Destination */}
        <div className="absolute bottom-3 left-3 text-white">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span className="font-semibold">{tour.destination}</span>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <Link href={`/tour/${tour.id}`}>
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {tour.title}
          </h3>
        </Link>

        {/* Agency */}
        {tour.agencyName && (
          <div className="flex items-center gap-1 mb-2">
            <p className="text-sm text-muted-foreground">
              {tour.agencyName}
            </p>
          </div>
        )}

        {/* Tour Details */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {(tour.days > 0 || tour.nights > 0) && (
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                {tour.days > 0 && `${tour.days}日`}
                {tour.nights > 0 && `${tour.nights}夜`}
              </span>
            </div>
          )}
        </div>

        {/* Rating Display */}
        <div className="flex items-center mb-3">
          {tour.rating && parseFloat(tour.rating) > 0 ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{parseFloat(tour.rating).toFixed(1)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({tour.reviewCount} 評價)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Star className="h-4 w-4" />
              <span>沒有評分</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tour.tags && tour.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tour.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground mb-3 italic">
          免責聲明：旅行社<span className="notranslate">WhatsApp</span>、電話、旅行團行程、收費等資訊以旅行社官網為準，詳情請往官網查詢
        </p>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            {tour.originalPrice && parseFloat(tour.originalPrice) > parseFloat(tour.price) && (
              <p className="text-sm text-muted-foreground line-through">
                {formatPrice(tour.originalPrice)}
              </p>
            )}
            <p className="text-2xl font-bold text-primary">
              {tour.price && parseFloat(tour.price) > 0 ? formatPrice(tour.price) : "HK$0"}
            </p>
          </div>
          <div className="flex gap-2">
            {tour.agencyWhatsapp && (
              <Button 
                size="sm" 
                variant="outline" 
                className="p-2 rounded-full h-10 w-10 notranslate" 
                title="WhatsApp"
                asChild
              >
                <a 
                  href={`https://wa.me/${tour.agencyWhatsapp.replace(/[^0-9]/g, '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              </Button>
            )}
            {tour.agencyPhone && (
              <Button 
                size="sm" 
                variant="outline" 
                className="p-2 rounded-full h-10 w-10" 
                title="電話"
                asChild
              >
                <a href={`tel:${tour.agencyPhone.replace(/[^0-9+]/g, '')}`}>
                  <Phone className="h-5 w-5" />
                </a>
              </Button>
            )}
            {tour.sourceUrl && (
              <Button 
                size="sm" 
                variant="outline" 
                className="p-2 rounded-full h-10 w-10" 
                title="查看 PDF 文件"
                asChild
              >
                <a href={tour.sourceUrl} target="_blank" rel="noopener noreferrer">
                  <FileText className="h-5 w-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
        
        {/* Rating and Comment Button - Merged */}
        <div className="mt-3">
          <Link href={`/tour/${tour.id}#reviews`} className="block">
            <Button 
              variant="outline" 
              className="w-full rounded-full h-10 text-sm"
            >
              <ThumbsUp className="h-4 w-4 mr-2" />
              好評留言 {tour.reviewCount && tour.reviewCount > 0 ? `(${tour.reviewCount})` : ''}
            </Button>
          </Link>
        </div>
        
        {/* Rating Stars */}
        {tour.rating && parseFloat(tour.rating) > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(parseFloat(tour.rating || "0"))
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {parseFloat(tour.rating || "0").toFixed(1)} ({tour.reviewCount} 評價)
            </span>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
