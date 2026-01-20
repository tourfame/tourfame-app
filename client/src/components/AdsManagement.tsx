import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Trash2, Upload, ExternalLink, Loader2, Play, Pause } from "lucide-react";

export default function AdsManagement() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [placement, setPlacement] = useState<"home_top" | "recommendations_top" | "favorites_top" | "search_top" | "notifications_top">("home_top");
  const [durationDays, setDurationDays] = useState<string>("7");
  const [isUploading, setIsUploading] = useState(false);
  const [filterPlacement, setFilterPlacement] = useState<string>("all");
  const [selectedAds, setSelectedAds] = useState<Set<number>>(new Set());

  const utils = trpc.useUtils();
  const { data: ads, refetch: refetchAds } = trpc.admin.getActiveAdvertisements.useQuery();

  const uploadImageMutation = trpc.admin.uploadAdImage.useMutation({
    onSuccess: (data) => {
      setImageUrl(data.imageUrl);
      setImagePreview(data.imageUrl);
      toast.success(`圖片上傳成功（${(data.fileSize / 1024).toFixed(0)} KB）`);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`上傳失敗: ${error.message}`);
      setIsUploading(false);
    },
  });

  const createAdMutation = trpc.admin.createAdvertisement.useMutation({
    onSuccess: () => {
      toast.success("廣告創建成功");
      handleReset();
      refetchAds();
    },
    onError: (error) => {
      toast.error(`創建失敗: ${error.message}`);
    },
  });

  const deleteAdMutation = trpc.admin.deleteAdvertisement.useMutation({
    onSuccess: () => {
      toast.success("廣告已刪除");
      utils.admin.getActiveAdvertisements.invalidate();
    },
    onError: (error) => {
      toast.error(`刪除失敗：${error.message}`);
    },
  });

  const toggleAdStatusMutation = trpc.admin.toggleAdStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.admin.getActiveAdvertisements.invalidate();
    },
    onError: (error) => {
      toast.error(`操作失敗：${error.message}`);
    },
  });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 檢查文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過 5MB");
      return;
    }

    // 檢查文件類型
    if (!file.type.startsWith("image/")) {
      toast.error("只能上傳圖片文件");
      return;
    }

    setImageFile(file);
    setIsUploading(true);

    // 讀取文件為 base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // 上傳到服務器
      uploadImageMutation.mutate({ 
        imageData: base64,
        mimeType: file.type 
      });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAd = () => {
    if (!imageUrl) {
      toast.error("請先上傳廣告圖片");
      return;
    }

    if (!linkUrl) {
      toast.error("請輸入跳轉鏈結");
      return;
    }

    const days = parseInt(durationDays) || 1;

    // 計算結束日期
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    createAdMutation.mutate({
      type: "tour", // 默認類型
      imageUrl,
      linkUrl,
      placement,
      durationDays: days,
    });
  };

  const handleDeleteAd = (adId: number) => {
    if (confirm("確定要刪除這個廣告嗎？")) {
      deleteAdMutation.mutate({ adId });
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedAds.size === 0) {
      toast.error("請先選擇要刪除的廣告");
      return;
    }

    if (!confirm(`確定要刪除選中的 ${selectedAds.size} 個廣告嗎？`)) {
      return;
    }

    // 逐個刪除選中的廣告
    const adsToDelete = Array.from(selectedAds);
    for (const adId of adsToDelete) {
      await deleteAdMutation.mutateAsync({ adId });
    }
    
    setSelectedAds(new Set());
    toast.success(`已刪除 ${selectedAds.size} 個廣告`);
  };

  const handleReset = () => {
    setImageFile(null);
    setImagePreview("");
    setImageUrl("");
    setLinkUrl("");
    setPlacement("home_top");
    setDurationDays("7");
  };

  const getPlacementLabel = (placement: string) => {
    const labels: Record<string, string> = {
      home_top: "首頁頂部",
      recommendations_top: "為你推薦頂部",
      favorites_top: "我的收藏頂部",
      search_top: "搜尋結果頂部",
      notifications_top: "回覆通知頂部",
    };
    return labels[placement] || placement;
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // 獲取篩選後的廣告列表
  const filteredAds = ads?.filter((ad: any) => filterPlacement === "all" || ad.placement === filterPlacement) || [];

  // 處理全選
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAds(new Set(filteredAds.map((ad: any) => ad.id)));
    } else {
      setSelectedAds(new Set());
    }
  };

  // 處理單個選擇
  const handleSelectAd = (adId: number, checked: boolean) => {
    const newSelected = new Set(selectedAds);
    if (checked) {
      newSelected.add(adId);
    } else {
      newSelected.delete(adId);
    }
    setSelectedAds(newSelected);
  };

  // 檢查是否全選
  const isAllSelected = filteredAds.length > 0 && filteredAds.every((ad: any) => selectedAds.has(ad.id));

  return (
    <div className="space-y-6">
      {/* 創建廣告表單 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 上傳圖片 */}
            <div className="space-y-2">
              <Label>上傳廣告圖片 *</Label>
              <div className="flex flex-col gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="ad-image-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("ad-image-upload")?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      上傳中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      選擇圖片
                    </>
                  )}
                </Button>
                <span className="text-xs text-muted-foreground">
                  最大 5MB，系統會自動壓縮到約 100KB
                </span>
              </div>

              {/* 圖片預覽 */}
              {imagePreview && (
                <div className="relative mt-2">
                  <img
                    src={imagePreview}
                    alt="廣告預覽"
                    className="w-full max-w-md h-auto rounded border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setImagePreview("");
                      setImageUrl("");
                      setImageFile(null);
                    }}
                    className="absolute top-2 right-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* 跳轉鏈結 */}
            <div className="space-y-2">
              <Label htmlFor="linkUrl">跳轉鏈結 *</Label>
              <Input
                id="linkUrl"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>

            {/* 廣告位置 */}
            <div className="space-y-2">
              <Label>廣告位置 *</Label>
              <Select
                value={placement}
                onValueChange={(value: "home_top" | "recommendations_top" | "favorites_top" | "search_top") => {
                  setPlacement(value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="選擇廣告位置" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4}>
                  <SelectItem value="home_top">首頁頂部</SelectItem>
                  <SelectItem value="recommendations_top">為你推薦頂部</SelectItem>
                  <SelectItem value="favorites_top">我的收藏頂部</SelectItem>
                  <SelectItem value="search_top">搜尋結果頂部</SelectItem>
                  <SelectItem value="notifications_top">回覆通知頂部</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 持續天數 */}
            <div className="space-y-2">
              <Label htmlFor="durationDays">持續天數 *</Label>
              <Input
                id="durationDays"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={durationDays}
                onChange={(e) => {
                  // 允許空字串和數字
                  const val = e.target.value;
                  if (val === "" || /^\d+$/.test(val)) {
                    setDurationDays(val);
                  }
                }}
                onBlur={() => {
                  // 失去焦點時，如果為空或小於1，設為1
                  const num = parseInt(durationDays);
                  if (isNaN(num) || num < 1) {
                    setDurationDays("1");
                  } else if (num > 365) {
                    setDurationDays("365");
                  }
                }}
              />
              <span className="text-xs text-muted-foreground">
                廣告將從今天開始顯示 {parseInt(durationDays) || 1} 天
              </span>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-2">
              <Button
                onClick={handleCreateAd}
                disabled={createAdMutation.isPending || !imageUrl || !linkUrl}
              >
                {createAdMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    創建中...
                  </>
                ) : (
                  "創建廣告"
                )}
              </Button>
              <Button variant="outline" onClick={handleReset}>
                重置
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 廣告列表 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">已創建的廣告</h3>
            {selectedAds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={deleteAdMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                刪除選中 ({selectedAds.size})
              </Button>
            )}
          </div>
          
          {/* 位置標籤篩選 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={filterPlacement === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPlacement("all")}
            >
              全部
            </Button>
            <Button
              variant={filterPlacement === "home_top" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPlacement("home_top")}
            >
              首頁頂部
            </Button>
            <Button
              variant={filterPlacement === "recommendations_top" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPlacement("recommendations_top")}
            >
              為你推薦頂部
            </Button>
            <Button
              variant={filterPlacement === "favorites_top" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPlacement("favorites_top")}
            >
              我的收藏頂部
            </Button>
            <Button
              variant={filterPlacement === "search_top" ? "default" : "outline"}
              onClick={() => setFilterPlacement("search_top")}
              size="sm"
            >
              搜尋結果頂部
            </Button>
            <Button
              variant={filterPlacement === "notifications_top" ? "default" : "outline"}
              onClick={() => setFilterPlacement("notifications_top")}
              size="sm"
            >
              回覆通知頂部
            </Button>
          </div>
          
          {filteredAds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">操作</TableHead>
                  <TableHead>預覽</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>跳轉鏈結</TableHead>
                  <TableHead>開始日期</TableHead>
                  <TableHead>結束日期</TableHead>
                  <TableHead>狀態</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAds.map((ad: any) => (
                  <TableRow key={ad.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedAds.has(ad.id)}
                        onCheckedChange={(checked) => handleSelectAd(ad.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant={ad.status === "active" ? "outline" : "default"}
                          size="sm"
                          onClick={() => toggleAdStatusMutation.mutate({
                            adId: ad.id,
                            status: ad.status === "active" ? "paused" : "active"
                          })}
                          disabled={toggleAdStatusMutation.isPending}
                          title={ad.status === "active" ? "暫停廣告" : "啟用廣告"}
                        >
                          {ad.status === "active" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={deleteAdMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <img
                        src={ad.imageUrl || ""}
                        alt="廣告"
                        className="w-20 h-20 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>{getPlacementLabel(ad.placement)}</TableCell>
                    <TableCell>
                      <a
                        href={ad.linkUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {ad.linkUrl?.substring(0, 30)}...
                      </a>
                    </TableCell>
                    <TableCell>{formatDate(ad.startDate)}</TableCell>
                    <TableCell>{formatDate(ad.endDate)}</TableCell>
                    <TableCell>
                      {ad.status === "active" ? (
                        <span className="text-green-600">活躍</span>
                      ) : (
                        <span className="text-gray-500">已暫停</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              暫無廣告，請創建第一個廣告
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
