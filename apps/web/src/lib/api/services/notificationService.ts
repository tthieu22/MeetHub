import { apiClient } from "../client";
import { Notification, PaginatedResponse } from "../types";

export class NotificationService {
  // 20. Danh sách thông báo chưa đọc
  static async getNotifications(
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<Notification>> {
    const response = await apiClient.get<PaginatedResponse<Notification>>(
      "/notifications",
      {
        page,
        limit,
      }
    );
    return response.data;
  }

  // Đánh dấu thông báo đã đọc
  static async markAsRead(notificationId: string): Promise<void> {
    await apiClient.put(`/notifications/${notificationId}/read`);
  }

  // Đánh dấu tất cả thông báo đã đọc
  static async markAllAsRead(): Promise<void> {
    await apiClient.put("/notifications/read-all");
  }
}
