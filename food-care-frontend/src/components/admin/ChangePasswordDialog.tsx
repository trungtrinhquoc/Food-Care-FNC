import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { changeUserPassword } from '../../services/usersApi';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onSuccess: () => void;
}

export function ChangePasswordDialog({
  open,
  onOpenChange,
  userId,
  onSuccess,
}: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;

    if (!newPassword.trim()) {
      alert('Vui lòng nhập mật khẩu mới');
      return;
    }

    if (newPassword.length < 6) {
      alert('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    setSaving(true);
    try {
      await changeUserPassword(userId, newPassword);
      alert('Đổi mật khẩu thành công');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewPassword('');
    setConfirmPassword('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đổi mật khẩu người dùng</DialogTitle>
          <DialogDescription>
            Nhập mật khẩu mới cho tài khoản này. Người dùng sẽ cần sử dụng mật khẩu mới để đăng nhập.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Mật khẩu mới *</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div>
            <Label>Xác nhận mật khẩu *</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Hủy
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
