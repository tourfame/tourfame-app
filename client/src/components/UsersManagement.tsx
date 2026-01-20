import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Edit, Trash2, Ban, CheckCircle, Loader2 } from "lucide-react";

export default function UsersManagement() {
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const { data: users, refetch: refetchUsers } = trpc.admin.getAllUsers.useQuery();

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("用戶更新成功");
      setShowEditDialog(false);
      setEditingUser(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`更新失敗: ${error.message}`);
    },
  });

  const deleteUserMutation = trpc.admin.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("用戶刪除成功");
      setShowDeleteDialog(false);
      setDeletingUserId(null);
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`刪除失敗: ${error.message}`);
    },
  });

  const bulkDeleteUsersMutation = trpc.admin.bulkDeleteUsers.useMutation({
    onSuccess: (data) => {
      toast.success(`成功刪除 ${data.deletedCount} 個用戶`);
      setShowBulkDeleteDialog(false);
      setSelectedUserIds([]);
      setSelectAll(false);
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`批量刪除失敗: ${error.message}`);
    },
  });

  const updateUserStatusMutation = trpc.admin.updateUserStatus.useMutation({
    onSuccess: () => {
      toast.success("用戶狀態更新成功");
      refetchUsers();
    },
    onError: (error: any) => {
      toast.error(`狀態更新失敗: ${error.message}`);
    },
  });

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleDelete = (userId: number) => {
    setDeletingUserId(userId);
    setShowDeleteDialog(true);
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) {
      toast.error("請先選擇要刪除的用戶");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const handleToggleUserStatus = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    updateUserStatusMutation.mutate({ userId, status: newStatus });
  };

  const handleUpdateSubmit = () => {
    if (!editingUser) return;

    const name = (document.getElementById("edit-user-name") as HTMLInputElement)?.value;
    const email = (document.getElementById("edit-user-email") as HTMLInputElement)?.value;
    const role = (document.getElementById("edit-user-role") as HTMLSelectElement)?.value as any;

    updateUserMutation.mutate({
      userId: editingUser.id,
      name,
      email,
      role,
    });
  };

  const confirmDelete = () => {
    if (!deletingUserId) return;
    deleteUserMutation.mutate({ userId: deletingUserId });
  };

  const confirmBulkDelete = () => {
    bulkDeleteUsersMutation.mutate({ userIds: selectedUserIds });
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked && users) {
      setSelectedUserIds(users.map((user: any) => user.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds([...selectedUserIds, userId]);
    } else {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
      setSelectAll(false);
    }
  };

  return (
    <>
      {/* Bulk Actions */}
      {selectedUserIds.length > 0 && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg flex items-center justify-between">
          <span className="text-sm">已選擇 {selectedUserIds.length} 個用戶</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            批量刪除
          </Button>
        </div>
      )}

      {!users || users.length === 0 ? (
        <p className="text-sm text-muted-foreground">沒有用戶資料</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID</TableHead>
              <TableHead>名稱</TableHead>
              <TableHead>電子郵件</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>狀態</TableHead>
              <TableHead>註冊日期</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: any) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => handleSelectUser(user.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.name || "-"}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                    {user.role === "admin" ? "管理員" : "用戶"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.status === "active" ? "default" : "destructive"}>
                    {user.status === "active" ? "正常" : "已暫停"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("zh-TW") : "-"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                      title="編輯"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleUserStatus(user.id, user.status)}
                      title={user.status === "active" ? "暫停用戶" : "啟用用戶"}
                      disabled={updateUserStatusMutation.isPending}
                    >
                      {user.status === "active" ? (
                        <Ban className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id)}
                      title="刪除"
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

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯用戶</DialogTitle>
            <DialogDescription>更新用戶的名稱、電子郵件和角色</DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-user-name">名稱</Label>
                <Input
                  id="edit-user-name"
                  defaultValue={editingUser.name || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-user-email">電子郵件</Label>
                <Input
                  id="edit-user-email"
                  type="email"
                  defaultValue={editingUser.email}
                />
              </div>
              <div>
                <Label htmlFor="edit-user-role">角色</Label>
                <Select defaultValue={editingUser.role}>
                  <SelectTrigger id="edit-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">用戶</SelectItem>
                    <SelectItem value="admin">管理員</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleUpdateSubmit} disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  保存
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認刪除</DialogTitle>
            <DialogDescription>
              您確定要刪除這個用戶嗎？此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認批量刪除</DialogTitle>
            <DialogDescription>
              您確定要刪除選中的 {selectedUserIds.length} 個用戶嗎？此操作無法撤銷。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmBulkDelete} disabled={bulkDeleteUsersMutation.isPending}>
              {bulkDeleteUsersMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
