import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * 圖片追蹤管理組件
 * 顯示圖片使用統計、未使用圖片列表、清理功能
 */
export function ImageTracking() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // 獲取圖片統計
  const { data: stats, refetch: refetchStats } = trpc.admin.getImageStats.useQuery();

  // 獲取未使用的圖片
  const { data: unusedImages, refetch: refetchUnused } = trpc.admin.getUnusedImages.useQuery();

  // 獲取清理歷史
  const { data: history, refetch: refetchHistory } = trpc.admin.getCleanupHistory.useQuery({ limit: 20 });

  // 清理圖片 mutation
  const cleanupMutation = trpc.admin.cleanupImages.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        setSelectedImages([]);
        refetchStats();
        refetchUnused();
        refetchHistory();
      } else {
        toast.error(data.message);
        if (data.errors && data.errors.length > 0) {
          data.errors.forEach(err => toast.error(err));
        }
      }
    },
    onError: (error) => {
      toast.error(`清理失敗：${error.message}`);
    },
  });

  const handleSelectImage = (fileName: string) => {
    setSelectedImages(prev =>
      prev.includes(fileName)
        ? prev.filter(f => f !== fileName)
        : [...prev, fileName]
    );
  };

  const handleSelectAll = () => {
    if (selectedImages.length === unusedImages?.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(unusedImages?.map(img => img.fileName) || []);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedImages.length === 0) {
      toast.error('請選擇要刪除的圖片');
      return;
    }
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    cleanupMutation.mutate({
      fileNames: selectedImages,
      reason: '管理員手動清理',
    });
    setShowDeleteDialog(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">總圖片數</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">使用中</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.used || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">未使用</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.unused || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">可釋放空間</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats ? formatFileSize(stats.unusedSize) : '0 B'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 未使用圖片列表 */}
      <Card>
        <CardHeader>
          <CardTitle>未使用的圖片</CardTitle>
          <CardDescription>
            這些圖片未被任何旅行團引用，可以安全刪除以釋放存儲空間
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unusedImages && unusedImages.length > 0 ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedImages.length === unusedImages.length ? '取消全選' : '全選'}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={selectedImages.length === 0 || cleanupMutation.isPending}
                  >
                    刪除選中 ({selectedImages.length})
                  </Button>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">選擇</TableHead>
                      <TableHead>文件名</TableHead>
                      <TableHead>大小</TableHead>
                      <TableHead>上傳時間</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unusedImages.map(img => (
                      <TableRow key={img.fileName}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedImages.includes(img.fileName)}
                            onChange={() => handleSelectImage(img.fileName)}
                            className="w-4 h-4"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">{img.fileName}</TableCell>
                        <TableCell>{formatFileSize(img.fileSize)}</TableCell>
                        <TableCell>{formatDate(img.uploadedAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              沒有未使用的圖片 ✨
            </div>
          )}
        </CardContent>
      </Card>

      {/* 清理歷史 */}
      <Card>
        <CardHeader>
          <CardTitle>清理歷史</CardTitle>
          <CardDescription>最近 20 條清理記錄</CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名</TableHead>
                    <TableHead>大小</TableHead>
                    <TableHead>刪除方式</TableHead>
                    <TableHead>刪除時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.fileName}</TableCell>
                      <TableCell>{log.fileSize ? formatFileSize(log.fileSize) : 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={log.deletedBy === 'auto' ? 'secondary' : 'default'}>
                          {log.deletedBy === 'auto' ? '自動' : '手動'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(log.deletedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              暫無清理記錄
            </div>
          )}
        </CardContent>
      </Card>

      {/* 刪除確認對話框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除 {selectedImages.length} 個圖片嗎？此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
