import { useCallback } from 'react';
import { toast } from 'sonner';
import type { ZaloReminder } from '../types/admin';

export function useZaloReminders(_reminders: ZaloReminder[]) {
  const sendReminder = useCallback((_reminderId: string) => {
    // TODO: Implement actual API call
    toast.success('Đã gửi nhắc nhở qua Zalo thành công!');
  }, []);

  const sendBulkReminders = useCallback(() => {
    // TODO: Implement actual API call
    toast.success('Đã gửi hàng loạt nhắc nhở qua Zalo!');
  }, []);

  return {
    sendReminder,
    sendBulkReminders,
  };
}
