import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Plus, ExternalLink, CheckCircle, XCircle, Clock, Edit, Trash2, Play, RefreshCw, ArrowUp, ArrowDown, MessageCircle, Phone, Eye, EyeOff, Check } from "lucide-react";
import UsersManagement from "@/components/UsersManagement";
import AdsManagement from "@/components/AdsManagement";
import { ImageTracking } from "@/components/ImageTracking";

// Users Management Component - Now imported from separate file

// Tours Management Component
function ToursManagement() {
  const [editingTour, setEditingTour] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<number | null>(null);

  const { data: tours, refetch: refetchTours } = trpc.admin.getAllTours.useQuery({ limit: 50 });

  const togglePublishMutation = trpc.tours.togglePublish.useMutation({
    onSuccess: () => {
      toast.success("已更新發佈狀態");
      refetchTours();
    },
    onError: (error) => {
      toast.error(error.message || "更新發佈狀態失敗");
    },
  });

  const updateTourMutation = trpc.admin.updateTour.useMutation({
    onSuccess: () => {
      toast.success("旅行團更新成功");
      setShowEditDialog(false);
      setEditingTour(null);
      refetchTours();
    },
    onError: (error: any) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const deleteTourMutation = trpc.admin.deleteTour.useMutation({
    onSuccess: () => {
      toast.success("旅行團刪除成功");
      setShowDeleteDialog(false);
      setDeletingTourId(null);
      refetchTours();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const handleEdit = (tour: any) => {
    setEditingTour(tour);
    setShowEditDialog(true);
  };

  const handleDelete = (tourId: number) => {
    setDeletingTourId(tourId);
    setShowDeleteDialog(true);
  };

  const handleUpdateSubmit = () => {
    if (!editingTour) return;

    const title = (document.getElementById("edit-tour-title") as HTMLInputElement)?.value;
    const destination = (document.getElementById("edit-tour-destination") as HTMLInputElement)?.value;
    const days = parseInt((document.getElementById("edit-tour-days") as HTMLInputElement)?.value);
    const nights = parseInt((document.getElementById("edit-tour-nights") as HTMLInputElement)?.value);
    const price = parseFloat((document.getElementById("edit-tour-price") as HTMLInputElement)?.value);
    const originalPrice = parseFloat((document.getElementById("edit-tour-original-price") as HTMLInputElement)?.value);
    const departureDate = (document.getElementById("edit-tour-departure-date") as HTMLInputElement)?.value;
    const tourType = (document.getElementById("edit-tour-type") as HTMLSelectElement)?.value as any;

    updateTourMutation.mutate({
      tourId: editingTour.id,
      title,
      destination,
      days,
      nights,
      price,
      originalPrice: originalPrice || undefined,
      departureDate,
      tourType,
    });
  };

  const confirmDelete = () => {
    if (!deletingTourId) return;
    deleteTourMutation.mutate({ tourId: deletingTourId });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>旅行團管理</CardTitle>
          <CardDescription>查看、編輯和刪除旅行團</CardDescription>
        </CardHeader>
        <CardContent>
          {!tours || tours.length === 0 ? (
            <p className="text-sm text-muted-foreground">沒有旅行團資料</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>標題</TableHead>
                  <TableHead>目的地</TableHead>
                  <TableHead>旅行社</TableHead>
                  <TableHead>天數</TableHead>
                  <TableHead>價格</TableHead>
                  <TableHead>出發日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>{tour.id}</TableCell>
                    <TableCell className="max-w-xs truncate">{tour.title}</TableCell>
                    <TableCell>{tour.destination}</TableCell>
                    <TableCell>{tour.agencyName}</TableCell>
                    <TableCell>
                      {tour.days && tour.days > 0 && `${tour.days}日`}
                      {tour.days && tour.days > 0 && tour.nights && tour.nights > 0 && ' '}
                      {tour.nights && tour.nights > 0 && `${tour.nights}夜`}
                      {(!tour.days || tour.days === 0) && (!tour.nights || tour.nights === 0) && '-'}
                    </TableCell>
                    <TableCell>HK${tour.price}</TableCell>
                    <TableCell>{tour.departureDate ? new Date(tour.departureDate).toLocaleDateString() : "-"}</TableCell>
                    <TableCell>
                      <Badge variant={tour.isPublished ? "default" : "secondary"}>
                        {tour.isPublished ? "已發佈" : "未發佈"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={tour.isPublished ? "outline" : "default"}
                          onClick={() => togglePublishMutation.mutate({ tourId: tour.id, isPublished: !tour.isPublished })}
                          disabled={togglePublishMutation.isPending}
                          title={tour.isPublished ? "取消發佈" : "發佈"}
                        >
                          {tour.isPublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(tour)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(tour.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Tour Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>編輯旅行團</DialogTitle>
            <DialogDescription>修改旅行團資訊</DialogDescription>
          </DialogHeader>
          {editingTour && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-tour-title">標題</Label>
                <Input id="edit-tour-title" defaultValue={editingTour.title} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tour-destination">目的地</Label>
                  <Input id="edit-tour-destination" defaultValue={editingTour.destination} />
                </div>
                <div>
                  <Label htmlFor="edit-tour-departure-date">出發日期</Label>
                  <Input id="edit-tour-departure-date" defaultValue={editingTour.departureDate} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tour-days">天數</Label>
                  <Input id="edit-tour-days" type="number" defaultValue={editingTour.days} />
                </div>
                <div>
                  <Label htmlFor="edit-tour-nights">夜數</Label>
                  <Input id="edit-tour-nights" type="number" defaultValue={editingTour.nights} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-tour-price">價格 (HK$)</Label>
                  <Input id="edit-tour-price" type="number" defaultValue={editingTour.price} />
                </div>
                <div>
                  <Label htmlFor="edit-tour-original-price">原價 (HK$)</Label>
                  <Input id="edit-tour-original-price" type="number" defaultValue={editingTour.originalPrice || ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-tour-type">團型</Label>
                <Select defaultValue={editingTour.tourType}>
                  <SelectTrigger id="edit-tour-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pure_play">純玩</SelectItem>
                    <SelectItem value="luxury">豪華</SelectItem>
                    <SelectItem value="cruise">郵輪</SelectItem>
                    <SelectItem value="budget">經濟</SelectItem>
                    <SelectItem value="family">家庭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={updateTourMutation.isPending}>
                  {updateTourMutation.isPending ? "更新中..." : "保存"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>您確定要刪除這個旅行團嗎？此操作無法復原。</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteTourMutation.isPending}>
              {deleteTourMutation.isPending ? "刪除中..." : "確認刪除"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Tour Cards List Component for managing front-end tour cards
function TourCardsList() {
  const [editingTour, setEditingTour] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingTourId, setDeletingTourId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTours, setSelectedTours] = useState<Set<number>>(new Set());
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  const { data: tours, refetch: refetchTours, isLoading } = trpc.admin.getAllTours.useQuery({ limit: 100 });

  const updateTourMutation = trpc.admin.updateTour.useMutation({
    onSuccess: () => {
      toast.success("旅行團更新成功");
      setShowEditDialog(false);
      setEditingTour(null);
      refetchTours();
    },
    onError: (error: any) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const deleteTourMutation = trpc.admin.deleteTour.useMutation({
    onSuccess: () => {
      toast.success("旅行團刪除成功");
      setShowDeleteDialog(false);
      setDeletingTourId(null);
      refetchTours();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const handleEdit = (tour: any) => {
    setEditingTour(tour);
    setShowEditDialog(true);
  };

  const handleDelete = (tourId: number) => {
    setDeletingTourId(tourId);
    setShowDeleteDialog(true);
  };

  const handleUpdateSubmit = () => {
    if (!editingTour) return;

    const title = (document.getElementById("card-edit-tour-title") as HTMLInputElement)?.value;
    const destination = (document.getElementById("card-edit-tour-destination") as HTMLInputElement)?.value;
    const pdfUrl = (document.getElementById("card-edit-tour-pdf") as HTMLInputElement)?.value;
    const agencyName = (document.getElementById("card-edit-tour-agency") as HTMLInputElement)?.value;

    updateTourMutation.mutate({
      tourId: editingTour.id,
      title,
      destination,
      pdfUrl,
      agencyName,
    });
  };

  const confirmDelete = () => {
    if (!deletingTourId) return;
    deleteTourMutation.mutate({ tourId: deletingTourId });
  };

  const batchDeleteToursMutation = trpc.admin.batchDeleteTours.useMutation({
    onSuccess: () => {
      toast.success(`成功刪除 ${selectedTours.size} 個旅行團`);
      setShowBatchDeleteDialog(false);
      setSelectedTours(new Set());
      refetchTours();
    },
    onError: (error: any) => {
      toast.error(`批量刪除失敗: ${error.message}`);
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredTours) {
      setSelectedTours(new Set(filteredTours.map((tour: any) => tour.id)));
    } else {
      setSelectedTours(new Set());
    }
  };

  const handleSelectTour = (tourId: number, checked: boolean) => {
    const newSelected = new Set(selectedTours);
    if (checked) {
      newSelected.add(tourId);
    } else {
      newSelected.delete(tourId);
    }
    setSelectedTours(newSelected);
  };

  const handleBatchDelete = () => {
    if (selectedTours.size === 0) {
      toast.error("請至少選擇一個旅行團");
      return;
    }
    setShowBatchDeleteDialog(true);
  };

  const confirmBatchDelete = () => {
    batchDeleteToursMutation.mutate({ tourIds: Array.from(selectedTours) });
  };

  // Filter tours by search query
  const filteredTours = tours?.filter((tour: any) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tour.agencyName?.toLowerCase().includes(query) ||
      tour.destination?.toLowerCase().includes(query) ||
      tour.title?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* Search and Batch Actions */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <Input
          placeholder="搜尋旅行社名稱、國家/地區..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        {selectedTours.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            刪除選中項目 ({selectedTours.size})
          </Button>
        )}
      </div>

      {/* Tour Cards Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={filteredTours && filteredTours.length > 0 && selectedTours.size === filteredTours.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="全選"
                />
              </TableHead>
              <TableHead className="w-[80px]">刪除</TableHead>
              <TableHead className="w-[150px]">旅行社名稱</TableHead>
              <TableHead className="w-[120px]">國家/地區</TableHead>
              <TableHead>PDF鏈結</TableHead>
              <TableHead className="w-[80px] text-right">編輯</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTours && filteredTours.length > 0 ? (
              filteredTours.map((tour: any) => (
                <TableRow key={tour.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTours.has(tour.id)}
                      onCheckedChange={(checked) => handleSelectTour(tour.id, checked as boolean)}
                      aria-label={`選擇 ${tour.agencyName}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tour.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{tour.agencyName || "-"}</TableCell>
                  <TableCell>{tour.destination || "-"}</TableCell>
                  <TableCell>
                    {tour.pdfUrl ? (
                      <a
                        href={tour.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm truncate max-w-[200px]"
                      >
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{tour.pdfUrl}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tour)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  暫無旅行團資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯旅行團資料</DialogTitle>
            <DialogDescription>修改旅行團卡片顯示的內容</DialogDescription>
          </DialogHeader>
          {editingTour && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="card-edit-tour-agency">旅行社名稱</Label>
                <Input
                  id="card-edit-tour-agency"
                  defaultValue={editingTour.agencyName || ""}
                />
              </div>
              <div>
                <Label htmlFor="card-edit-tour-title">旅行團名稱</Label>
                <Input
                  id="card-edit-tour-title"
                  defaultValue={editingTour.title || ""}
                />
              </div>
              <div>
                <Label htmlFor="card-edit-tour-destination">國家/地區</Label>
                <Input
                  id="card-edit-tour-destination"
                  defaultValue={editingTour.destination || ""}
                />
              </div>
              <div>
                <Label htmlFor="card-edit-tour-pdf">PDF鏈結</Label>
                <Input
                  id="card-edit-tour-pdf"
                  defaultValue={editingTour.pdfUrl || ""}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={updateTourMutation.isPending}>
                  {updateTourMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    "保存"
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              確定要刪除這個旅行團嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTourMutation.isPending}
            >
              {deleteTourMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  刪除中...
                </>
              ) : (
                "刪除"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Delete Confirmation Dialog */}
      <Dialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認批量刪除</DialogTitle>
            <DialogDescription>
              確定要刪除選中的 {selectedTours.size} 個旅行團嗎？此操作無法復原。
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowBatchDeleteDialog(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBatchDelete}
              disabled={batchDeleteToursMutation.isPending}
            >
              {batchDeleteToursMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  刪除中...
                </>
              ) : (
                "刪除"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Category options
const categories = [
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
] as const;

export default function Admin() {
  // 清除 Google Translate 狀態，防止閃爍問題
  useEffect(() => {
    // 強制移除 Google Translate 元素
    const removeGoogleTranslate = () => {
      // 移除 Google Translate 工具欄
      const banner = document.querySelector('.goog-te-banner-frame');
      if (banner) banner.remove();
      
      // 移除 Google Translate 容器
      const container = document.querySelector('#google_translate_element');
      if (container) container.remove();
      
      // 重置頁面語言
      document.documentElement.lang = 'zh-TW';
      document.documentElement.removeAttribute('translate');
      
      // 刪除 Google Translate cookies
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + window.location.hostname;
      
      // 移除所有 Google Translate 添加的 font 標籤
      const fonts = document.querySelectorAll('font');
      fonts.forEach(font => {
        const parent = font.parentNode;
        if (parent) {
          while (font.firstChild) {
            parent.insertBefore(font.firstChild, font);
          }
          parent.removeChild(font);
        }
      });
    };
    
    removeGoogleTranslate();
    
    // 延遲再次清除（確保完全移除）
    const timer = setTimeout(removeGoogleTranslate, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const [url, setUrl] = useState("");
  const [agencyId, setAgencyId] = useState<number | null>(null);
  const [category, setCategory] = useState<"japan" | "thailand" | "korea" | "taiwan" | "vietnam" | "singapore" | "malaysia" | "indonesia" | "philippines" | "australia" | "france" | "uk" | "italy" | "asia" | "long_haul" | "china_long_haul" | "guangdong">("japan");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [scrapedTours, setScrapedTours] = useState<any[]>([]);

  // Helper function to normalize days and nights
  const normalizeDaysAndNights = (tours: any[]) => {
    return tours.map(tour => {
      let days = tour.days;
      let nights = tour.nights;

      // If only days is provided, calculate nights
      if ((days !== undefined && days !== null && days > 0) && (nights === undefined || nights === null || nights === 0)) {
        nights = days - 1;
      }
      // If only nights is provided, calculate days
      else if ((nights !== undefined && nights !== null && nights > 0) && (days === undefined || days === null || days === 0)) {
        days = nights + 1;
      }

      return { ...tour, days, nights };
    });
  };
  const [scrapedUrl, setScrapedUrl] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [editingScrapedIndex, setEditingScrapedIndex] = useState<number | null>(null);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scrape" | "agencies" | "users" | "images" | "ads" | "image-tracking">("scrape");
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [taskQueue, setTaskQueue] = useState<number[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedError, setSelectedError] = useState<{ jobId: number; message: string } | null>(null);
  const [showManualInputDialog, setShowManualInputDialog] = useState(false);
  const [manualInputAgencyId, setManualInputAgencyId] = useState<number | null>(null);
  
  // Load deleted tour indices from localStorage
  const [deletedTourIndices, setDeletedTourIndices] = useState<Map<number, Set<number>>>(() => {
    try {
      const stored = localStorage.getItem('deletedTourIndices');
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Map(Object.entries(parsed).map(([key, value]) => [Number(key), new Set(value as number[])]));
      }
    } catch (error) {
      console.error('[DeletedTours] Failed to load from localStorage:', error);
    }
    return new Map();
  });
  
  // Save deleted tour indices to localStorage whenever it changes
  useEffect(() => {
    try {
      const toStore: Record<number, number[]> = {};
      deletedTourIndices.forEach((value, key) => {
        toStore[key] = Array.from(value);
      });
      localStorage.setItem('deletedTourIndices', JSON.stringify(toStore));
    } catch (error) {
      console.error('[DeletedTours] Failed to save to localStorage:', error);
    }
  }, [deletedTourIndices]);
  const [agencyEdits, setAgencyEdits] = useState<Record<number, { whatsapp: string; phone: string }>>({});
  const [savingAgencyId, setSavingAgencyId] = useState<number | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  // State for scraped tour edits (agency, category, image)
  const [scrapedTourEdits, setScrapedTourEdits] = useState<Record<number, { agencyId?: number; category?: string; imageFile?: File; imagePreview?: string; isPublished?: boolean; title?: string; destination?: string; price?: number; days?: number; nights?: number; highlights?: string; whatsapp?: string; phone?: string }>>({});
  // State for create agency dialog
  const [showCreateAgencyDialog, setShowCreateAgencyDialog] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyWhatsapp, setNewAgencyWhatsapp] = useState("");
  const [newAgencyPhone, setNewAgencyPhone] = useState("");

  const { data: jobs, refetch: refetchJobs } = trpc.admin.getScrapeJobs.useQuery();
  const { data: agencies, refetch: refetchAgencies } = trpc.tours.getAgencies.useQuery();

  // Sort agencies: by sortOrder (higher first), then by id (newer first)
  const sortedAgencies = agencies ? [...agencies].sort((a, b) => {
    const aSortOrder = (a as any).sortOrder ?? 0;
    const bSortOrder = (b as any).sortOrder ?? 0;
    
    // Higher sortOrder comes first
    if (aSortOrder !== bSortOrder) return bSortOrder - aSortOrder;
    
    // If sortOrder is the same, newer (higher id) comes first
    return b.id - a.id;
  }) : [];

  const scrapeUrlMutation = trpc.admin.scrapeUrl.useMutation({
    onSuccess: (data: any) => {
      toast.dismiss("direct-scrape");
      const message = data.usedOcr 
        ? `✅ 成功抓取 ${data.toursFound} 個旅行團（使用 OCR 識別圖片型 PDF，提取了 ${data.extractedLength || 0} 字符）`
        : `✅ 成功抓取 ${data.toursFound} 個旅行團（提取了 ${data.extractedLength || 0} 字符）`;
      toast.success(message, { duration: 5000 });
      
      setScrapedTours(normalizeDaysAndNights(data.tours));
      setScrapedUrl(url); // 保存原始 URL
      setShowImportDialog(true);
      setUrl("");
    },
    onError: (error: any) => {
      toast.dismiss("direct-scrape");
      toast.error(`抓取失敗: ${error.message}`);
    },
  });

  const createJobMutation = trpc.admin.createScrapeJob.useMutation({
    onSuccess: (data) => {
      toast.success("爬蟲任務已創建，正在執行爬取...");
      setUrl("");
      setAgencyId(null);
      refetchJobs();
      // Auto-execute the scrape job
      if (data.jobId) {
        handleExecute(data.jobId);
      }
    },
    onError: (error: any) => {
      toast.error(`創建失敗: ${error.message}`);
    },
  });

  const createManualTourMutation = trpc.admin.createManualTour.useMutation({
    onSuccess: () => {
      toast.success("旅行團創建成功");
      setShowManualInputDialog(false);
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`創建失敗: ${error.message}`);
    },
  });

  const executeMutation = trpc.admin.executeScrape.useMutation({
    onSuccess: async (data: any) => {
      // 顯示詳細的成功訊息
      const message = data.usedOcr 
        ? `✅ 成功抓取 ${data.toursFound} 個旅行團（使用 OCR 識別圖片型 PDF，提取了 ${data.extractedLength || 0} 字符）`
        : `✅ 成功抓取 ${data.toursFound} 個旅行團（提取了 ${data.extractedLength || 0} 字符）`;
      toast.success(message, { duration: 5000 });
      
      setScrapedTours(normalizeDaysAndNights(data.tours));
      setShowImportDialog(true);
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`爬取失敗: ${error.message}`);
    },
  });

  const importMutation = trpc.admin.importTours.useMutation({
    onSuccess: (data) => {
      toast.success(`成功導入 ${data.imported} 個旅行團`);
      
      // 批量導入時，為每個旅行社生成 vCard
      const agencyMap = new Map<number, { name: string; whatsapp: string; phone: string }>();
      
      scrapedTours.forEach((tour, index) => {
        const edits = scrapedTourEdits[index] || {};
        const selectedJob = jobs?.find(j => j.id === selectedJobId);
        const agencyId = edits.agencyId || selectedJob?.agencyId;
        
        if (agencyId) {
          const agency = agencies?.find(a => a.id === agencyId);
          if (agency && !agencyMap.has(agencyId)) {
            agencyMap.set(agencyId, {
              name: agency.name,
              whatsapp: edits.whatsapp || tour.whatsapp || agency.whatsapp || '',
              phone: edits.phone || tour.phone || agency.phone || '',
            });
          }
        }
      });
      
      // 為每個旅行社下載 vCard
      agencyMap.forEach((agencyInfo) => {
        const vCardContent = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${agencyInfo.name}`,
          `ORG:${agencyInfo.name}`,
          agencyInfo.whatsapp ? `TEL;TYPE=CELL:${agencyInfo.whatsapp}` : '',
          agencyInfo.phone ? `TEL;TYPE=WORK:${agencyInfo.phone}` : '',
          'END:VCARD'
        ].filter(line => line !== '').join('\r\n');
        
        const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${agencyInfo.name}.vcf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      
      setShowImportDialog(false);
      setScrapedTours([]);
      setSelectedJobId(null);
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`導入失敗: ${error.message}`);
    },
  });

  const uploadPdfMutation = trpc.admin.uploadPdfForPreview.useMutation({
    onSuccess: () => {
      // Refetch jobs to get updated pdfUrl
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`PDF 上傳失敗: ${error.message}`);
    },
  });

  const uploadLogoMutation = trpc.admin.uploadAgencyLogo.useMutation({
    onSuccess: (data) => {
      toast.success("旅行團圖片上傳成功");
      setUploadedImageUrl(data.logoUrl); // Save the uploaded image URL
      setLogoFile(null);
      setLogoPreview(null);
    },
    onError: (error: any) => {
      toast.error(`上傳失敗: ${error.message}`);
    },
  });

  const deleteMutation = trpc.admin.deleteScrapeJob.useMutation({
    onSuccess: () => {
      toast.success("任務已刪除");
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.admin.bulkDeleteScrapeJobs.useMutation({
    onSuccess: (data) => {
      toast.success(`成功刪除 ${data.deleted} 個任務`);
      setSelectedJobIds(new Set());
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`批量刪除失敗: ${error.message}`);
    },
  });

  const removeDuplicatesMutation = trpc.admin.removeDuplicates.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || `已刪除 ${data.deletedCount} 個重複旅行團`, { duration: 5000 });
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`刪除重複失敗: ${error.message}`);
    },
  });

  const updateAgencyMutation = trpc.tours.updateAgency.useMutation({
    onSuccess: () => {
      toast.success("旅行社資訊已保存");
      setSavingAgencyId(null);
      // 刷新旅行社列表
      refetchAgencies();
    },
    onError: (error: any) => {
      toast.error(`保存失敗: ${error.message}`);
      setSavingAgencyId(null);
      console.error("Update agency error:", error);
    },
  });

  const createAgencyMutation = trpc.tours.createAgency.useMutation({
    onSuccess: () => {
      toast.success("旅行社已新增");
      setShowCreateAgencyDialog(false);
      setNewAgencyName("");
      setNewAgencyWhatsapp("");
      setNewAgencyPhone("");
      refetchAgencies();
    },
    onError: (error) => {
      toast.error(`新增失敗：${error.message}`);
    },
  });

  const deleteAgencyMutation = trpc.tours.deleteAgency.useMutation({
    onSuccess: () => {
      toast.success("旅行社已刪除");
      // 刷新旅行社列表
      refetchAgencies();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗: ${error.message}`);
      console.error("Delete agency error:", error);
    },
  });

  const swapAgencySortOrderMutation = trpc.tours.swapAgencySortOrder.useMutation({
    onMutate: (variables) => {
      toast.loading('正在調整排序...', { id: 'swap-sort' });
    },
    onSuccess: (data) => {
      toast.success('排序已更新', { id: 'swap-sort' });
      refetchAgencies();
    },
    onError: (error: any) => {
      console.error('[SwapSort] Error:', error);
      toast.error(`排序失敗: ${error.message}`, { id: 'swap-sort' });
    },
  });

  const updateJobMutation = trpc.admin.updateScrapeJobInfo.useMutation({
    onSuccess: () => {
      toast.success("任務已更新");
      setShowEditDialog(false);
      setEditingJob(null);
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const handleScrapedImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setScrapedTourEdits(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          imageFile: file,
          imagePreview: reader.result as string,
        }
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleScrapedCategoryChange = (index: number, categoryValue: string) => {
    setScrapedTourEdits(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        category: categoryValue,
      }
    }));
  };

  const handleScrapedAgencyChange = (index: number, agencyId: string) => {
    const selectedAgency = agencies?.find(a => a.id === parseInt(agencyId));
    setScrapedTourEdits(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        agencyId: parseInt(agencyId),
        whatsapp: selectedAgency?.whatsapp || '',
        phone: selectedAgency?.phone || '',
      }
    }));
    
    // 同時更新 DOM 中的輸入框值
    const whatsappInput = document.getElementById(`scraped-whatsapp-${index}`) as HTMLInputElement;
    const phoneInput = document.getElementById(`scraped-phone-${index}`) as HTMLInputElement;
    if (whatsappInput) whatsappInput.value = selectedAgency?.whatsapp || '';
    if (phoneInput) phoneInput.value = selectedAgency?.phone || '';
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("請選擇圖片檔案");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("圖片大小不能超過5MB");
      return;
    }

    setLogoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadLogo = async () => {
    if (!logoFile || !agencyId) {
      toast.error("請選擇旅行社和圖片");
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadLogoMutation.mutate({
        agencyId,
        imageData: base64,
        mimeType: logoFile.type,
      });
    };
    reader.readAsDataURL(logoFile);
  };

  const [extractedTours, setExtractedTours] = useState<any[]>([]);
  const [extractedAgencyName, setExtractedAgencyName] = useState<string>("");
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [editingExtractedIndex, setEditingExtractedIndex] = useState<number | null>(null);
  const [importingTourIndex, setImportingTourIndex] = useState<number | null>(null);

  const batchCreateMutation = trpc.admin.batchCreateScrapeJobs.useMutation({
    onSuccess: (data: any) => {
      const tours = data.tours || [];
      const agencyName = data.agencyName || "其他";
      const toursCount = tours.length;
      
      if (toursCount > 0) {
        // 顯示提取成功訊息
        toast.success(`✅ 成功提取 ${toursCount} 個旅行團資訊（旅行社：${agencyName}）`);
        // 儲存提取結果並顯示預覽對話框
        setExtractedTours(tours);
        setExtractedAgencyName(agencyName);
        setShowPreviewDialog(true);
      } else {
        toast.warning(`⚠️ 未找到旅行團資訊，請檢查輸入內容`);
      }
      setUrl("");
    },
    onError: (error: any) => {
      toast.error(`提取失敗: ${error.message}`);
    },
  });

  const importToursMutation = trpc.admin.importExtractedTours.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message || `成功導入 ${data.imported} 個旅行團`);
      setShowPreviewDialog(false);
      setExtractedTours([]);
      setExtractedAgencyName("");
      refetchJobs();
    },
    onError: (error: any) => {
      toast.error(`導入失敗: ${error.message}`);
    },
  });

  const handleCreateJob = async () => {
    if (!url.trim()) {
      toast.error("請輸入旅行團文字資訊");
      return;
    }

    // 顯示開始提取的訊息
    toast.info("🔍 正在分析文字內容...");
    
    // 直接將文字內容傳送到後端提取
    batchCreateMutation.mutate({ textContent: url });
  };

  const handleExecute = (jobId: number) => {
    // 將任務加入佇列
    setTaskQueue(prev => [...prev, jobId]);
  };

  const handleManualInputSubmit = () => {
    
    if (!manualInputAgencyId) {
      toast.error("請選擇旅行社");
      return;
    }

    const title = (document.getElementById("manual-title") as HTMLInputElement)?.value;
    const destination = (document.getElementById("manual-destination") as HTMLInputElement)?.value;
    const days = parseInt((document.getElementById("manual-days") as HTMLInputElement)?.value);
    const nights = parseInt((document.getElementById("manual-nights") as HTMLInputElement)?.value);
    const price = parseFloat((document.getElementById("manual-price") as HTMLInputElement)?.value);
    const originalPrice = parseFloat((document.getElementById("manual-original-price") as HTMLInputElement)?.value);
    const departureDate = (document.getElementById("manual-departure-date") as HTMLInputElement)?.value;
    const returnDate = (document.getElementById("manual-return-date") as HTMLInputElement)?.value;
    const highlights = (document.getElementById("manual-highlights") as HTMLTextAreaElement)?.value;
    const itinerary = (document.getElementById("manual-itinerary") as HTMLTextAreaElement)?.value;
    const includes = (document.getElementById("manual-includes") as HTMLTextAreaElement)?.value;
    const excludes = (document.getElementById("manual-excludes") as HTMLTextAreaElement)?.value;
    const remarks = (document.getElementById("manual-remarks") as HTMLTextAreaElement)?.value;

    if (!title || !destination || isNaN(days) || isNaN(nights) || isNaN(price)) {
      toast.error("請填寫所有必填欄位，並確保數字格式正確");
      console.error("[Manual Input] Validation failed", { title, destination, days, nights, price });
      return;
    }

    createManualTourMutation.mutate({
      agencyId: manualInputAgencyId,
      title,
      destination,
      days,
      nights,
      price,
      originalPrice: isNaN(originalPrice) ? undefined : originalPrice,
      departureDate: departureDate || undefined,
      returnDate: returnDate || undefined,
      highlights: highlights || undefined,
      itinerary: itinerary || undefined,
      includes: includes || undefined,
      excludes: excludes || undefined,
      remarks: remarks || undefined,
    });
  };
  
  // 處理任務佇列
  useEffect(() => {
    if (taskQueue.length === 0 || isProcessingQueue) return;
    
    const processNextTask = async () => {
      setIsProcessingQueue(true);
      const jobId = taskQueue[0];
      setSelectedJobId(jobId);
      
      // 顯示處理中的 toast
      toast.loading("🔍 正在抓取網頁內容...", { 
        id: `scrape-${jobId}`,
        duration: Infinity 
      });
      
      try {
        await executeMutation.mutateAsync({ jobId });
      } catch (error) {
        console.error('Task execution failed:', error);
      } finally {
        toast.dismiss(`scrape-${jobId}`);
        // 移除已完成的任務
        setTaskQueue(prev => prev.slice(1));
        setIsProcessingQueue(false);
      }
    };
    
    processNextTask();
  }, [taskQueue, isProcessingQueue, executeMutation]);

  const handleImport = async () => {
    if (scrapedTours.length === 0) {
      toast.error("沒有可導入的數據");
      return;
    }

    // 檢查每個旅行團是否都有旅行社 ID
    const toursWithAgency = scrapedTours.map((tour, index) => {
      const edits = scrapedTourEdits[index] || {};
      const agencyId = edits.agencyId;
      
      if (!agencyId) {
        return null;
      }
      
      const agency = agencies?.find(a => a.id === agencyId);
      const fallbackImageUrl = agency?.logoUrl || undefined;
      
      return {
        ...tour,
        agencyId,
        category: edits.category,
        tourType: tour.tourType || "pure_play" as const,
        imageUrl: edits.imagePreview || tour.imageUrl || fallbackImageUrl || undefined,
        scrapeJobId: tour.scrapeJobId || selectedJobId, // 使用旅行團已有的 scrapeJobId，或者使用 selectedJobId
        isPublished: edits.isPublished !== false, // 預設為發佈
      };
    });

    // 檢查是否有未選擇旅行社的旅行團
    if (toursWithAgency.some(t => t === null)) {
      toast.error("請為所有旅行團選擇旅行社");
      return;
    }

    // 直接導入旅行團（不需要創建新任務，因為 scrapeJobId 已經存在）
    const firstTour = toursWithAgency[0]!;
    
    try {
      // 直接導入旅行團
      importMutation.mutate({
        jobId: firstTour.scrapeJobId!, // 使用第一個旅行團的 scrapeJobId
        tours: toursWithAgency as any[],
      });
    } catch (error: any) {
      toast.error(`導入失敗: ${error.message}`);
    }
  };

  const getStatusBadge = (status: string, errorMessage?: string | null) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            完成
          </Badge>
        );
      case "failed":
        return (
          <div className="flex items-center gap-2">
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              失敗
            </Badge>
            {errorMessage && (
              <span className="text-xs text-muted-foreground truncate max-w-[200px]" title={errorMessage}>
                {errorMessage}
              </span>
            )}
          </div>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            處理中
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            等待中
          </Badge>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 notranslate">
        <div>
          <h1 className="mb-2">管理員後台</h1>
          <p className="text-muted-foreground">
            管理爬蟲任務和旅行社資訊
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setActiveTab("scrape")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "scrape"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            新增爬蟲任務
          </button>
          <button
            onClick={() => setActiveTab("agencies")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "agencies"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            旅行社
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "users"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            管理會員
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "ads"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            廣告管理
          </button>

          <button
            onClick={() => setActiveTab("image-tracking")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "image-tracking"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            圖片管理
          </button>

        </div>

        {/* Scrape Jobs Tab */}
        {activeTab === "scrape" && (
          <>
        {/* Create Scrape Job */}
        <Card>
          <CardHeader>
            <CardTitle>新增旅行團資料</CardTitle>
            <CardDescription>
              貼上旅行團文字資訊，系統將自動提取旅行團資料
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="url">旅行團文字資訊（最多提取 50 個旅行團）</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUrl('')}
                    disabled={!url.trim()}
                    className="text-xs"
                  >
                    清除文字
                  </Button>
                </div>
                <textarea
                  id="url"
                  placeholder="貼上旅行團資訊，例如：&#10;&#10;目的地：埃及&#10;題目：埃及 探索法老迷城、尼羅河兩岸文明&#10;團費：HKD 31,998 + (優惠 HKD 30,998 +)&#10;PDF 鏈結：https://www.jetour.com.hk/storage/app/media/pdf/sp-med25-022-1229-kgt.pdf"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full min-h-[200px] px-3 py-2 border border-input rounded-md bg-background text-sm"
                  rows={10}
                />
              </div>

              <Button
                onClick={handleCreateJob}
                disabled={batchCreateMutation.isPending}
                className="w-full"
              >
                {batchCreateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    批量創建中...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    提取旅行團資料
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 旅行團管理列表 */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>管理旅行團卡片</CardTitle>
            <CardDescription>管理前端顯示的旅行團資料</CardDescription>
          </CardHeader>
          <CardContent>
            <TourCardsList />
          </CardContent>
        </Card>

        {/* Scrape Jobs List - Hidden for simplified workflow */}
        {false && <Card>
          <CardHeader>
            <CardTitle>爬蟲任務列表</CardTitle>
            <CardDescription>查看所有爬蟲任務的狀態</CardDescription>
            {/* Category Filter Tabs */}
            <div className="space-y-4 mb-4">
              <div>
                <p className="text-sm font-medium mb-2">狀態篩選</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={statusFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter(null)}
                  >
                    全部
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    待執行
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "processing" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("processing")}
                  >
                    執行中
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                  >
                    完成
                  </Button>
                  <Button
                    type="button"
                    variant={statusFilter === "failed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("failed")}
                  >
                    失敗
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">分類篩選</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={categoryFilter === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCategoryFilter(null)}
                  >
                    全部
                  </Button>
              <Button
                type="button"
                variant={categoryFilter === "japan" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("japan")}
              >
                日本
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "thailand" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("thailand")}
              >
                泰國
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "korea" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("korea")}
              >
                韓國
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "taiwan" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("taiwan")}
              >
                台灣
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "vietnam" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("vietnam")}
              >
                越南
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "singapore" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("singapore")}
              >
                新加坡
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "malaysia" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("malaysia")}
              >
                馬來西亞
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "indonesia" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("indonesia")}
              >
                印尼
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "philippines" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("philippines")}
              >
                菲律賓
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "australia" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("australia")}
              >
                澳洲
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "france" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("france")}
              >
                法國
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "uk" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("uk")}
              >
                英國
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "italy" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("italy")}
              >
                意大利
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "asia" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("asia")}
              >
                亞洲
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "long_haul" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("long_haul")}
              >
                長線
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "guangdong" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("guangdong")}
              >
                廣東省
              </Button>
              <Button
                type="button"
                variant={categoryFilter === "china_long_haul" ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter("china_long_haul")}
              >
                中國長線
              </Button>
                </div>
              </div>
            </div>
            {/* Bulk Delete Button & Remove Duplicates Button */}
            {selectedJobIds.size > 0 && (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={async () => {
                    const selectedJobs = jobs?.filter(j => selectedJobIds.has(j.id) && j.status === 'pending') || [];
                    if (selectedJobs.length === 0) {
                      toast.error("沒有待執行的任務");
                      return;
                    }
                    
                    if (!confirm(`確定要執行選中的 ${selectedJobs.length} 個任務嗎？`)) {
                      return;
                    }

                    let successCount = 0;
                    let failCount = 0;
                    const allTours: any[] = [];

                    for (let i = 0; i < selectedJobs.length; i++) {
                      const job = selectedJobs[i];
                      
                      try {
                        toast.loading(`🔍 正在抓取 ${i + 1}/${selectedJobs.length}: ${job.url.substring(0, 50)}...`, { 
                          id: "batch-execute"
                        });

                        setSelectedJobId(job.id);
                        const result = await executeMutation.mutateAsync({ jobId: job.id });
                        
                        if (result.tours && result.tours.length > 0) {
                          // 為每個旅行團添加 scrapeJobId 和 sourceUrl
                          const toursWithJobId = result.tours.map((tour: any) => ({
                            ...tour,
                            scrapeJobId: job.id,
                            sourceUrl: job.url
                          }));
                          allTours.push(...toursWithJobId);
                          successCount++;
                        } else {
                          failCount++;
                        }
                      } catch (error: any) {
                        console.error(`抓取失敗: ${job.url}`, error);
                        failCount++;
                      }
                    }

                    toast.dismiss("batch-execute");

                    if (successCount > 0) {
                      toast.success(`✅ 成功抓取 ${successCount} 個任務，共找到 ${allTours.length} 個旅行團${failCount > 0 ? `（${failCount} 個失敗）` : ''}`, { duration: 5000 });
                      setScrapedTours(normalizeDaysAndNights(allTours));
                      setShowImportDialog(true);
                      setSelectedJobIds(new Set());
                    } else {
                      toast.error(`所有任務都抓取失敗`);
                    }
                  }}
                >
                  <Play className="h-4 w-4 mr-2" />
                  批量執行 ({selectedJobIds.size})
                </Button>
                </div>
                <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const selectedJobs = jobs?.filter(j => selectedJobIds.has(j.id) && j.status === "failed") || [];
                    if (selectedJobs.length === 0) {
                      toast.error("請選擇至少一個失敗的任務");
                      return;
                    }

                    let successCount = 0;
                    let failCount = 0;
                    const allTours: any[] = [];

                    for (let i = 0; i < selectedJobs.length; i++) {
                      const job = selectedJobs[i];
                      
                      try {
                        toast.loading(`🔄 正在重試 ${i + 1}/${selectedJobs.length}: ${job.url.substring(0, 50)}...`, { 
                          id: "batch-retry"
                        });

                        const result = await executeMutation.mutateAsync({ jobId: job.id });
                        
                        if (result.tours && result.tours.length > 0) {
                          const toursWithJobId = result.tours.map((tour: any) => ({
                            ...tour,
                            scrapeJobId: job.id,
                            sourceUrl: job.url
                          }));
                          allTours.push(...toursWithJobId);
                          successCount++;
                        } else {
                          failCount++;
                        }
                      } catch (error: any) {
                        console.error(`重試失敗: ${job.url}`, error);
                        failCount++;
                      }
                    }

                    toast.dismiss("batch-retry");

                    if (successCount > 0) {
                      toast.success(`✅ 成功重試 ${successCount} 個任務，共找到 ${allTours.length} 個旅行團${failCount > 0 ? `（${failCount} 個失敗）` : ''}`, { duration: 5000 });
                      setScrapedTours(normalizeDaysAndNights(allTours));
                      setShowImportDialog(true);
                      setSelectedJobIds(new Set());
                    } else {
                      toast.error(`所有任務都重試失敗`);
                    }
                  }}
                  disabled={executeMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  批量重試 ({Array.from(selectedJobIds).filter(id => jobs?.find(j => j.id === id && j.status === "failed")).length})
                </Button>
                </div>
                <div className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm(`確定要刪除選中的 ${selectedJobIds.size} 個任務嗎？`)) {
                      bulkDeleteMutation.mutate({ ids: Array.from(selectedJobIds) });
                    }
                  }}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除選中 ({selectedJobIds.size})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('確定要刪除所有重複的旅行團嗎？\n\n重複判斷標準：目的地、旅行團標題、旅行社名稱完全相同\n將保留最新的記錄')) {
                      removeDuplicatesMutation.mutate();
                    }
                  }}
                  disabled={removeDuplicatesMutation.isPending}
                >
                  {removeDuplicatesMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  刪除重複
                </Button>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {/* 任務執行進度提示條 */}
            {(isProcessingQueue || taskQueue.length > 0) && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-900 dark:text-blue-100">
                  {isProcessingQueue && selectedJobId ? (
                    <>正在執行任務 #{selectedJobId}...</>
                  ) : (
                    <>準備執行任務...</>
                  )}
                  {taskQueue.length > 1 && (
                    <span className="ml-2 text-blue-700 dark:text-blue-300">
                      （佇列中還有 {taskQueue.length - 1} 個任務）
                    </span>
                  )}
                </span>
              </div>
            )}
            {!jobs || jobs?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                還沒有任何爬蟲任務
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={(jobs?.filter((job) => categoryFilter === null || job.category === categoryFilter).length ?? 0) > 0 && (jobs?.filter((job) => categoryFilter === null || job.category === categoryFilter).every((job) => selectedJobIds.has(job.id)) ?? false)}
                        onChange={(e) => {
                          const filteredJobs = jobs?.filter((job) => categoryFilter === null || job.category === categoryFilter) || [];
                          if (e.target.checked) {
                            setSelectedJobIds(new Set(filteredJobs.map((job) => job.id)));
                          } else {
                            setSelectedJobIds(new Set());
                          }
                        }}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>旅行社</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>找到</TableHead>
                    <TableHead>已導入</TableHead>
                    <TableHead>創建時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs
                    ?.filter((job) => categoryFilter === null || job.category === categoryFilter)
                    .filter((job) => statusFilter === null || job.status === statusFilter)
                    .map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedJobIds.has(job.id)}
                          onChange={(e) => {
                            const newSet = new Set(selectedJobIds);
                            if (e.target.checked) {
                              newSet.add(job.id);
                            } else {
                              newSet.delete(job.id);
                            }
                            setSelectedJobIds(newSet);
                          }}
                          className="cursor-pointer"
                        />
                      </TableCell>
                      <TableCell>{job.id}</TableCell>
                      <TableCell>
                        {agencies?.find(a => a.id === job.agencyId)?.name || '未設定'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {job.status === "pending" && (
                            <span className="text-sm text-muted-foreground">待執行</span>
                          )}
                          {job.status === "failed" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleExecute(job.id)}
                                disabled={executeMutation.isPending && selectedJobId === job.id}
                              >
                                {executeMutation.isPending &&
                                selectedJobId === job.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "重試"
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedError({ jobId: job.id, message: job.errorMessage || '未知錯誤' });
                                  setShowErrorDialog(true);
                                }}
                              >
                                查看錯誤
                              </Button>
                            </>
                          )}
                          {job.status === "completed" && job.rawData && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                setSelectedJobId(job.id);
                                const allTours = JSON.parse(job.rawData!);
                                // Filter out deleted tours
                                const deletedIndices = deletedTourIndices.get(job.id) || new Set();
                                const filteredTours = allTours
                                  .filter((_: any, index: number) => !deletedIndices.has(index));
                                setScrapedTours(normalizeDaysAndNights(filteredTours));
                                
                                // If sourceUrl exists but no pdfUrl, upload PDF on-demand
                                if (job.sourceUrl && !job.pdfUrl) {
                                  try {
                                    await uploadPdfMutation.mutateAsync({ jobId: job.id });
                                  } catch (error) {
                                    console.error('Failed to upload PDF:', error);
                                    // Still show dialog even if upload fails
                                  }
                                }
                                
                                setShowImportDialog(true);
                              }}
                            >
                              查看結果
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm('確定要刪除這個任務嗎？')) {
                                deleteMutation.mutate({ id: job.id });
                              }
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.url.startsWith('text://') ? (
                          <span className="text-muted-foreground text-sm">文字輸入</span>
                        ) : (
                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            查看 PDF
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(job.status, job.errorMessage)}</TableCell>
                      <TableCell>{job.toursFound}</TableCell>
                      <TableCell>{job.toursImported}</TableCell>
                      <TableCell>
                        {new Date(job.createdAt).toLocaleString("zh-HK")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>}
          </>
        )}

        {/* Agencies Tab */}
        {activeTab === "agencies" && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>旅行社管理</CardTitle>
                <CardDescription>編輯旅行社WhatsApp和電話號碼</CardDescription>
              </div>
              <Button onClick={() => setShowCreateAgencyDialog(true)}>
                新增旅行社
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sortedAgencies?.map((agency) => (
                  <div key={agency.id} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{agency.name}</h3>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentIndex = sortedAgencies.findIndex(a => a.id === agency.id);
                            if (currentIndex > 0) {
                              const currentAgency = sortedAgencies[currentIndex];
                              const prevAgency = sortedAgencies[currentIndex - 1];
                              
                              // 使用新的 swap API 一次性交換兩個旅行社的 sortOrder
                              swapAgencySortOrderMutation.mutate({
                                agencyId1: currentAgency.id,
                                agencyId2: prevAgency.id,
                              });
                            }
                          }}
                          disabled={sortedAgencies.findIndex(a => a.id === agency.id) === 0 || swapAgencySortOrderMutation.isPending}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const currentIndex = sortedAgencies.findIndex(a => a.id === agency.id);
                            if (currentIndex < sortedAgencies.length - 1) {
                              const currentAgency = sortedAgencies[currentIndex];
                              const nextAgency = sortedAgencies[currentIndex + 1];
                              
                              // 使用新的 swap API 一次性交換兩個旅行社的 sortOrder
                              swapAgencySortOrderMutation.mutate({
                                agencyId1: currentAgency.id,
                                agencyId2: nextAgency.id,
                              });
                            }
                          }}
                          disabled={sortedAgencies.findIndex(a => a.id === agency.id) === sortedAgencies.length - 1 || swapAgencySortOrderMutation.isPending}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`whatsapp-${agency.id}`}>WhatsApp號碼</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`whatsapp-${agency.id}`}
                            defaultValue={agency.whatsapp || ""}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const whatsapp = (document.getElementById(`whatsapp-${agency.id}`) as HTMLInputElement)?.value;
                              if (whatsapp) {
                                window.open(`https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}`, '_blank');
                              } else {
                                toast.error('請先輸入 WhatsApp 號碼');
                              }
                            }}
                            title="測試 WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor={`phone-${agency.id}`}>電話號碼</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`phone-${agency.id}`}
                            defaultValue={agency.phone || ""}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const phone = (document.getElementById(`phone-${agency.id}`) as HTMLInputElement)?.value;
                              if (phone) {
                                window.open(`tel:${phone.replace(/[^0-9+]/g, '')}`, '_self');
                              } else {
                                toast.error('請先輸入電話號碼');
                              }
                            }}
                            title="測試撥打電話"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          const whatsapp = (document.getElementById(`whatsapp-${agency.id}`) as HTMLInputElement)?.value;
                          const phone = (document.getElementById(`phone-${agency.id}`) as HTMLInputElement)?.value;
                          setSavingAgencyId(agency.id);
                          updateAgencyMutation.mutate({
                            agencyId: agency.id,
                            whatsapp: whatsapp || undefined,
                            phone: phone || undefined,
                          });
                        }}
                        disabled={savingAgencyId === agency.id}
                      >
                        {savingAgencyId === agency.id ? "保存中..." : "保存"}
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`確定要刪除旅行社「${agency.name}」嗎？此操作無法復原。`)) {
                            deleteAgencyMutation.mutate({ agencyId: agency.id });
                          }
                        }}
                        disabled={deleteAgencyMutation.isPending}
                      >
                        {deleteAgencyMutation.isPending ? "刪除中..." : "刪除"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Create Agency Dialog */}
        <Dialog open={showCreateAgencyDialog} onOpenChange={setShowCreateAgencyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增旅行社</DialogTitle>
              <DialogDescription>輸入旅行社名稱和聯絡資訊</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-agency-name">旅行社名稱 *</Label>
                <Input
                  id="new-agency-name"
                  value={newAgencyName}
                  onChange={(e) => setNewAgencyName(e.target.value)}
                  placeholder="例如：捷旅"
                />
              </div>
              <div>
                <Label htmlFor="new-agency-whatsapp">WhatsApp號碼</Label>
                <Input
                  id="new-agency-whatsapp"
                  value={newAgencyWhatsapp}
                  onChange={(e) => setNewAgencyWhatsapp(e.target.value)}
                  placeholder="例如：98765432"
                />
              </div>
              <div>
                <Label htmlFor="new-agency-phone">電話號碼</Label>
                <Input
                  id="new-agency-phone"
                  value={newAgencyPhone}
                  onChange={(e) => setNewAgencyPhone(e.target.value)}
                  placeholder="例如：3180 9966"
                />
              </div>
              <div className="flex justify-start gap-2">
                <Button variant="outline" onClick={() => setShowCreateAgencyDialog(false)}>
                  取消
                </Button>
                <Button
                  onClick={() => {
                    if (!newAgencyName.trim()) {
                      toast.error("請輸入旅行社名稱");
                      return;
                    }
                    createAgencyMutation.mutate({
                      name: newAgencyName.trim(),
                      whatsapp: newAgencyWhatsapp.trim() || undefined,
                      phone: newAgencyPhone.trim() || undefined,
                    });
                  }}
                  disabled={createAgencyMutation.isPending}
                >
                  {createAgencyMutation.isPending ? "新增中..." : "確認新增"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>會員管理</CardTitle>
              <CardDescription>查看、編輯和管理用戶資訊</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersManagement />
            </CardContent>
          </Card>
        )}



        {/* Ads Management Tab */}
        {activeTab === "ads" && (
          <Card>
            <CardHeader>
              <CardTitle>廣告管理</CardTitle>
              <CardDescription>創建和管理彈出式廣告</CardDescription>
            </CardHeader>
            <CardContent>
              <AdsManagement />
            </CardContent>
          </Card>
        )}

        {/* 圖片管理標籤頁 */}
        {activeTab === "image-tracking" && (
          <ImageTracking />
        )}

      {/* Edit Job Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯爬蟲任務</DialogTitle>
            <DialogDescription>更新任務的名稱、URL、旅行社和類別</DialogDescription>
          </DialogHeader>
          {editingJob && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="edit-name">任務名稱</Label>
                <Input
                  id="edit-name"
                  defaultValue={editingJob.name || ""}
                />
              </div>

              <div>
                <Label htmlFor="edit-url">網站URL</Label>
                <Input
                  id="edit-url"
                  type="url"
                  defaultValue={editingJob.url}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-agency">旅行社</Label>
                  <Select defaultValue={editingJob.agencyId?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="選擇旅行社" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedAgencies.map((agency) => (
                        <SelectItem key={agency.id} value={agency.id.toString()}>
                          {agency.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category">類別</Label>
                  <Select defaultValue={editingJob.category || "asia"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="japan">日本</SelectItem>
                      <SelectItem value="thailand">泰國</SelectItem>
                      <SelectItem value="korea">韓國</SelectItem>
                      <SelectItem value="taiwan">台灣</SelectItem>
                      <SelectItem value="vietnam">越南</SelectItem>
                      <SelectItem value="singapore">新加坡</SelectItem>
                      <SelectItem value="malaysia">馬來西亞</SelectItem>
                      <SelectItem value="indonesia">印尼</SelectItem>
                      <SelectItem value="philippines">菲律賓</SelectItem>
                      <SelectItem value="australia">澳洲</SelectItem>
                      <SelectItem value="france">法國</SelectItem>
                      <SelectItem value="uk">英國</SelectItem>
                      <SelectItem value="italy">意大利</SelectItem>
                      <SelectItem value="asia">亞洲</SelectItem>
                      <SelectItem value="long_haul">長線</SelectItem>
                      <SelectItem value="guangdong">廣東省</SelectItem>
                      <SelectItem value="china_long_haul">中國長線</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="default"
                  onClick={() => {
                    handleExecute(editingJob.id);
                    setShowEditDialog(false);
                  }}
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending && selectedJobId === editingJob.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      執行中...
                    </>
                  ) : (
                    "執行"
                  )}
                </Button>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button
                  onClick={() => {
                    const name = (document.getElementById("edit-name") as HTMLInputElement)?.value;
                    const url = (document.getElementById("edit-url") as HTMLInputElement)?.value;
                    updateJobMutation.mutate({
                      id: editingJob.id,
                      name: name || undefined,
                      url: url || undefined,
                    });
                  }}
                  disabled={updateJobMutation.isPending}
                >
                  {updateJobMutation.isPending ? "更新中..." : "保存"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>預覽抓取結果</DialogTitle>
            <DialogDescription>
              共找到 {scrapedTours.length} 個旅行團，確認後點擊導入
              {scrapedTours.some(tour => !tour.price || tour.price === 0) && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                  ⚠️ 有旅行團的價格為 0，請點擊編輯按鈕設定價格後才能導入
                </div>
              )}
              {selectedJobId && jobs && (() => {
                const selectedJob = jobs.find(j => j.id === selectedJobId);
                const selectedAgency = agencies?.find(a => a.id === selectedJob?.agencyId);
                return selectedAgency ? (
                  <div className="mt-2 text-sm">
                    <strong>旅行社：</strong>{selectedAgency.name}
                    {selectedAgency.whatsapp && <> | <strong>WhatsApp：</strong>{selectedAgency.whatsapp}</>}
                    {selectedAgency.phone && <> | <strong>電話：</strong>{selectedAgency.phone}</>}
                  </div>
                ) : null;
              })()}
            </DialogDescription>
          </DialogHeader>

          {/* PDF Preview */}
          {selectedJobId && jobs?.find(j => j.id === selectedJobId)?.pdfUrl && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">PDF 文件預覽</h3>
              <div className="border rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  src={jobs.find(j => j.id === selectedJobId)?.pdfUrl || undefined}
                  className="w-full h-full"
                  title="PDF Preview"
                />
              </div>
            </div>
          )}

          <div className="space-y-4">
            {scrapedTours.map((tour, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {editingScrapedIndex === index ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`scraped-image-${index}`}>旅行團圖片（可選）</Label>
                            <Input
                              id={`scraped-image-${index}`}
                              type="file"
                              accept="image/jpeg,image/png"
                              className="mt-1"
                              onChange={(e) => handleScrapedImageChange(index, e)}
                            />
                            {(scrapedTourEdits[index]?.imagePreview || tour.imageUrl) && (
                              <div className="mt-2">
                                <img 
                                  src={scrapedTourEdits[index]?.imagePreview || tour.imageUrl} 
                                  alt="預覽" 
                                  className="w-32 h-32 object-cover rounded" 
                                  onError={(e) => {
                                    // 如果圖片加載失敗，隱藏圖片
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div>
                            <Label htmlFor={`scraped-agency-${index}`}>旅行社</Label>
                            <Select
                              value={scrapedTourEdits[index]?.agencyId?.toString() || (() => {
                                const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                return selectedJob?.agencyId?.toString() || '';
                              })()}
                              onValueChange={(value) => handleScrapedAgencyChange(index, value)}
                            >
                              <SelectTrigger id={`scraped-agency-${index}`} className="mt-1">
                                <SelectValue placeholder="選擇旅行社" />
                              </SelectTrigger>
                              <SelectContent>
                                {sortedAgencies?.map((agency) => (
                                  <SelectItem key={agency.id} value={agency.id.toString()}>
                                    {agency.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>分類</Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {categories.map((cat) => (
                                <Button
                                  key={cat.value}
                                  type="button"
                                  size="sm"
                                  variant={(() => {
                                    const currentCategory = scrapedTourEdits[index]?.category || (() => {
                                      const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                      return selectedJob?.category;
                                    })();
                                    return currentCategory === cat.value ? "default" : "outline";
                                  })()}
                                  onClick={() => handleScrapedCategoryChange(index, cat.value)}
                                  className="text-sm"
                                >
                                  {cat.label}
                                </Button>
                              ))}
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`scraped-url-${index}`}>網站URL</Label>
                            <Input
                              id={`scraped-url-${index}`}
                              defaultValue={tour.sourceUrl || (() => {
                                const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                return selectedJob?.url || '';
                              })()}
                              placeholder="https://example.com/tour-details"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`scraped-title-${index}`}>標題</Label>
                            <Input
                              id={`scraped-title-${index}`}
                              defaultValue={tour.title}
                              className="mt-1"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`scraped-destination-${index}`}>目的地</Label>
                              <Input
                                id={`scraped-destination-${index}`}
                                defaultValue={tour.destination}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`scraped-price-${index}`}>價格 (HK$)</Label>
                              <Input
                                id={`scraped-price-${index}`}
                                type="number"
                                defaultValue={tour.price}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`scraped-days-${index}`}>天數</Label>
                              <Input
                                id={`scraped-days-${index}`}
                                type="number"
                                defaultValue={tour.days}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`scraped-nights-${index}`}>夜數</Label>
                              <Input
                                id={`scraped-nights-${index}`}
                                type="number"
                                defaultValue={tour.nights}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          {tour.highlights && (
                            <div>
                              <Label htmlFor={`scraped-highlights-${index}`}>行程亮點</Label>
                              <Input
                                id={`scraped-highlights-${index}`}
                                defaultValue={tour.highlights}
                                className="mt-1"
                              />
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor={`scraped-whatsapp-${index}`}>WhatsApp號碼</Label>
                              <Input
                                id={`scraped-whatsapp-${index}`}
                                defaultValue={(() => {
                                  const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                  const selectedAgency = agencies?.find(a => a.id === selectedJob?.agencyId);
                                  return tour.whatsapp || selectedAgency?.whatsapp || '';
                                })()}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`scraped-phone-${index}`}>電話號碼</Label>
                              <Input
                                id={`scraped-phone-${index}`}
                                defaultValue={(() => {
                                  const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                  const selectedAgency = agencies?.find(a => a.id === selectedJob?.agencyId);
                                  return tour.phone || selectedAgency?.phone || '';
                                })()}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingScrapedIndex(null)}
                            >
                              取消
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={async () => {
                                const edits = scrapedTourEdits[index] || {};
                                const selectedJob = jobs?.find(j => j.id === selectedJobId);
                                const agencyId = edits.agencyId || selectedJob?.agencyId;
                                
                                if (!agencyId) {
                                  toast.error("請先選擇旅行社");
                                  return;
                                }
                                
                                const agency = agencies?.find(a => a.id === agencyId);
                                const fallbackImageUrl = agency?.logoUrl || undefined;
                                
                                const tourToImport = {
                                  ...tour,
                                  title: edits.title || tour.title,
                                  destination: edits.destination || tour.destination,
                                  price: edits.price !== undefined ? edits.price : tour.price,
                                  days: edits.days !== undefined ? edits.days : tour.days,
                                  nights: edits.nights !== undefined ? edits.nights : tour.nights,
                                  highlights: edits.highlights || tour.highlights,
                                  whatsapp: edits.whatsapp || tour.whatsapp,
                                  phone: edits.phone || tour.phone,
                                  agencyId,
                                  category: edits.category,
                                  tourType: tour.tourType || "pure_play" as const,
                                  imageUrl: edits.imagePreview || tour.imageUrl || fallbackImageUrl || undefined,
                                  scrapeJobId: tour.scrapeJobId || selectedJobId,
                                  isPublished: true,
                                };
                                
                                importMutation.mutate({
                                  jobId: tourToImport.scrapeJobId!,
                                  tours: [tourToImport] as any[],
                                }, {
                                  onSuccess: () => {
                                    // 導入成功後生成並下載 vCard
                                    const agencyName = agency?.name || '旅行社';
                                    const whatsapp = tourToImport.whatsapp || '';
                                    const phone = tourToImport.phone || '';
                                    
                                    // 生成 vCard 內容
                                    const vCardContent = [
                                      'BEGIN:VCARD',
                                      'VERSION:3.0',
                                      `FN:${agencyName}`,
                                      `ORG:${agencyName}`,
                                      whatsapp ? `TEL;TYPE=CELL:${whatsapp}` : '',
                                      phone ? `TEL;TYPE=WORK:${phone}` : '',
                                      'END:VCARD'
                                    ].filter(line => line !== '').join('\r\n');
                                    
                                    // 創建 Blob 並下載
                                    const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `${agencyName}.vcf`;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    URL.revokeObjectURL(url);
                                    
                                    // 從列表中移除
                                    setScrapedTours(prev => prev.filter((_, i) => i !== index));
                                    setEditingScrapedIndex(null);
                                    toast.success("已成功導入旅行團並下載資料名片");
                                  },
                                  onError: (error: any) => {
                                    toast.error(`導入失敗: ${error.message}`);
                                  }
                                });
                              }}
                              className="ml-auto"
                              disabled={importMutation.isPending}
                            >
                              <Check className="h-4 w-4 mr-1" /> 確認導入
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <CardTitle>{tour.title}</CardTitle>
                          <CardDescription className="space-y-1">
                            <div>
                              目的地：{tour.destination}
                            </div>
                            {(() => {
                              const selectedJob = jobs?.find(j => j.id === selectedJobId);
                              const agencyId = scrapedTourEdits[index]?.agencyId || selectedJob?.agencyId;
                              const agency = agencies?.find(a => a.id === agencyId);
                              
                              return (
                                <>
                                  {agency?.whatsapp && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <MessageCircle className="h-3 w-3" />
                                      <span>WhatsApp：{agency.whatsapp}</span>
                                    </div>
                                  )}
                                  {agency?.phone && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Phone className="h-3 w-3" />
                                      <span>電話：{agency.phone}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                            <div>
                            {tour.days > 0 ? `${tour.days}日` : ''}
                            {tour.nights > 0 ? `${tour.nights}夜` : ''}
                            {' · '}
                              {tour.price && tour.price > 0 ? (
                                <span>HK${tour.price}</span>
                              ) : (
                                <span className="text-red-500 font-medium">⚠️ 請設定價格</span>
                              )}
                            </div>
                          </CardDescription>
                        </>
                      )}
                    </div>
                    {editingScrapedIndex !== index && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingScrapedIndex(index)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            
                            
                            // Track deleted index for this job
                            if (selectedJobId) {
                              const currentDeleted = deletedTourIndices.get(selectedJobId) || new Set();
                              // Need to map current index to original index
                              const allTours = JSON.parse(jobs?.find(j => j.id === selectedJobId)?.rawData || '[]');
                              const currentTour = scrapedTours[index];
                              const originalIndex = allTours.findIndex((t: any) => 
                                t.title === currentTour.title && 
                                t.destination === currentTour.destination && 
                                t.price === currentTour.price
                              );
                              if (originalIndex !== -1) {
                                currentDeleted.add(originalIndex);
                                setDeletedTourIndices(new Map(deletedTourIndices.set(selectedJobId, currentDeleted)));
                              }
                            }
                            
                            const updatedTours = scrapedTours.filter((_, i) => i !== index);
                            
                            setScrapedTours(updatedTours);
                            
                            // 同時更新 scrapedTourEdits
                            const updatedEdits = { ...scrapedTourEdits };
                            delete updatedEdits[index];
                            // 重新映射索引
                            const remappedEdits: typeof scrapedTourEdits = {};
                            Object.keys(updatedEdits).forEach(key => {
                              const oldIndex = parseInt(key);
                              const newIndex = oldIndex > index ? oldIndex - 1 : oldIndex;
                              remappedEdits[newIndex] = updatedEdits[oldIndex];
                            });
                            setScrapedTourEdits(remappedEdits);
                            
                            toast.success("已刪除旅行團");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                {tour.highlights && editingScrapedIndex !== index && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tour.highlights}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || scrapedTours.some(tour => !tour.price || tour.price === 0)}
            >
              {importMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  導入中...
                </>
              ) : scrapedTours.some(tour => !tour.price || tour.price === 0) ? (
                "請設定所有旅行團的價格"
              ) : (
                "確認導入"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 錯誤詳情對話框 */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>任務執行錯誤詳情</DialogTitle>
            <DialogDescription>
              任務 #{selectedError?.jobId} 的錯誤信息和可能的解決方案
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">錯誤信息</Label>
              <div className="mt-2 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap">
                  {selectedError?.message}
                </p>
              </div>
            </div>
            <div>
              <Label className="text-base font-semibold">可能的解決方案</Label>
              <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md space-y-2">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  • <strong>PDF 格式問題</strong>：確認 PDF 檔案未加密、未損壞，且包含可讀取的文字內容
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  • <strong>URL 無效</strong>：檢查 URL 是否正確、網站是否可訪問，或者是否需要登入
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  • <strong>網絡問題</strong>：稍後重試，或者檢查網絡連接是否穩定
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  • <strong>內容格式不符</strong>：確認網頁內容包含旅行團資訊（標題、價格、天數等）
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowErrorDialog(false)}>
                關閉
              </Button>
              <Button onClick={() => {
                setShowErrorDialog(false);
                if (selectedError) {
                  handleExecute(selectedError.jobId);
                }
              }}>
                重試此任務
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 提取結果預覽對話框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>提取結果預覽</DialogTitle>
            <DialogDescription>
              已成功提取 {extractedTours.length} 個旅行團資訊，將導入到「{extractedAgencyName}」旅行社
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {extractedTours.map((tour, index) => (
              <Card key={index} className="relative">
                <CardHeader className="pb-2">
                  {editingExtractedIndex === index ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`edit-agency-${index}`}>旅行社</Label>
                        <Input
                          id={`edit-agency-${index}`}
                          defaultValue={extractedAgencyName}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-title-${index}`}>旅行團名稱</Label>
                        <Input
                          id={`edit-title-${index}`}
                          defaultValue={tour.title}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-destination-${index}`}>目的地</Label>
                        <Input
                          id={`edit-destination-${index}`}
                          defaultValue={tour.destination}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {extractedAgencyName}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{tour.title || '未命名旅行團'}</CardTitle>
                      <CardDescription>
                        {tour.destination && `目的地：${tour.destination}`}
                      </CardDescription>
                    </>
                  )}
                </CardHeader>
                <CardContent>
                  {editingExtractedIndex === index ? (
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor={`edit-price-${index}`}>價格 (HKD)</Label>
                        <Input
                          id={`edit-price-${index}`}
                          type="number"
                          defaultValue={tour.price}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-pdf-${index}`}>PDF 連結</Label>
                        <Input
                          id={`edit-pdf-${index}`}
                          defaultValue={tour.pdfUrl}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-semibold">天數：</span> {tour.days || 0} 天
                      </div>
                      <div>
                        <span className="font-semibold">夜數：</span> {tour.nights || 0} 夜
                      </div>
                      {tour.price && tour.price > 0 && (
                        <div>
                          <span className="font-semibold">價格：</span> HKD {tour.price}
                        </div>
                      )}
                      {tour.pdfUrl && (
                        <div className="col-span-2">
                          <span className="font-semibold">PDF 連結：</span>
                          <a href={tour.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-2">
                            查看 PDF
                          </a>
                        </div>
                      )}
                      {tour.highlights && (
                        <div className="col-span-2">
                          <span className="font-semibold">行程亮點：</span>
                          <p className="mt-1 text-gray-600">{tour.highlights}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                    {editingExtractedIndex === index ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // 保存編輯
                            const agencyName = (document.getElementById(`edit-agency-${index}`) as HTMLInputElement)?.value;
                            const title = (document.getElementById(`edit-title-${index}`) as HTMLInputElement)?.value;
                            const destination = (document.getElementById(`edit-destination-${index}`) as HTMLInputElement)?.value;
                            const price = parseFloat((document.getElementById(`edit-price-${index}`) as HTMLInputElement)?.value);
                            const pdfUrl = (document.getElementById(`edit-pdf-${index}`) as HTMLInputElement)?.value;
                            
                            setExtractedAgencyName(agencyName);
                            setExtractedTours(prev => prev.map((t, i) => 
                              i === index ? { ...t, title, destination, price, pdfUrl } : t
                            ));
                            setEditingExtractedIndex(null);
                            toast.success("已保存修改");
                          }}
                        >
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingExtractedIndex(null);
                          }}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingExtractedIndex(index);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          編輯
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setExtractedTours(prev => prev.filter((_, i) => i !== index));
                            toast.info("已移除該旅行團");
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          刪除
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {extractedTours.length > 0 && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button variant="outline" onClick={() => {
                setShowPreviewDialog(false);
                setExtractedTours([]);
              }}>
                取消
              </Button>
              <Button onClick={async () => {
                try {
                  toast.info("正在導入所有旅行團資訊...");
                  await importToursMutation.mutateAsync({ 
                    tours: extractedTours,
                    agencyName: extractedAgencyName,
                  });
                } catch (error) {
                  // 錯誤已由 mutation 處理
                }
              }} disabled={importToursMutation.isPending}>
                {importToursMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    導入中...
                  </>
                ) : (
                  `全部導入 (${extractedTours.length} 個旅行團)`
                )}
              </Button>
            </div>
          )}
          {extractedTours.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              所有旅行團已導入或移除
              <div className="mt-4">
                <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                  關閉
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 手動輸入旅行團對話框 */}
      <Dialog open={showManualInputDialog} onOpenChange={setShowManualInputDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>手動輸入旅行團資料</DialogTitle>
            <DialogDescription>
              為 {agencies?.find(a => a.id === manualInputAgencyId)?.name || '旅行社'} 手動輸入旅行團資訊
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-title">旅行團標題 *</Label>
                <Input id="manual-title" placeholder="例：日本東京5天6夜" />
              </div>
              <div>
                <Label htmlFor="manual-destination">目的地 *</Label>
                <Input id="manual-destination" placeholder="例：日本東京" />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="manual-days">天數 *</Label>
                <Input id="manual-days" type="number" defaultValue={5} />
              </div>
              <div>
                <Label htmlFor="manual-nights">夜數 *</Label>
                <Input id="manual-nights" type="number" defaultValue={4} />
              </div>
              <div>
                <Label htmlFor="manual-price">價格 (HKD) *</Label>
                <Input id="manual-price" type="number" placeholder="8888" />
              </div>
              <div>
                <Label htmlFor="manual-original-price">原價 (HKD)</Label>
                <Input id="manual-original-price" type="number" placeholder="9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="manual-departure-date">出發日期</Label>
                <Input id="manual-departure-date" type="date" />
              </div>
              <div>
                <Label htmlFor="manual-return-date">回程日期</Label>
                <Input id="manual-return-date" type="date" />
              </div>
            </div>
            <div>
              <Label htmlFor="manual-highlights">行程亮點</Label>
              <textarea
                id="manual-highlights"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                placeholder="例：東京鐵塔、淺草寺、富士山五合目..."
              />
            </div>
            <div>
              <Label htmlFor="manual-itinerary">詳細行程</Label>
              <textarea
                id="manual-itinerary"
                className="w-full min-h-[120px] px-3 py-2 text-sm border rounded-md"
                placeholder="第一天：...
第二天：..."
              />
            </div>
            <div>
              <Label htmlFor="manual-includes">費用包括</Label>
              <textarea
                id="manual-includes"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                placeholder="例：機票、酒店住宿、早餐..."
              />
            </div>
            <div>
              <Label htmlFor="manual-excludes">費用不包括</Label>
              <textarea
                id="manual-excludes"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                placeholder="例：簽證費、旅遊保險、個人消費..."
              />
            </div>
            <div>
              <Label htmlFor="manual-remarks">備註</Label>
              <textarea
                id="manual-remarks"
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md"
                placeholder="其他重要信息..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowManualInputDialog(false)}>
              取消
            </Button>
            <Button onClick={handleManualInputSubmit} disabled={createManualTourMutation.isPending}>
              {createManualTourMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  創建中...
                </>
              ) : (
                "創建旅行團"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  );
}
