import { apiClient } from "@web/lib/api/client";
import { User } from "@web/types/chat";

export class UserService {
  // 24. Chặn người dùng khác
  static async blockUser(userId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/block`);
  }

  // 25. Bỏ chặn người dùng
  static async unblockUser(userId: string): Promise<void> {
    await apiClient.delete(`/users/${userId}/block`);
  }

  // 26. Danh sách người dùng đã chặn
  static async getBlockedUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>("/users/blocked");
    return response.data;
  }

  // Lấy thông tin user hiện tại
  static async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>("/users/me");
    return response.data;
  }

  // Cập nhật thông tin user
  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>("/users/me", data);
    return response.data;
  }

  // Lấy danh sách người dùng online
  static async getOnlineUsers(): Promise<string[]> {
    const response = await apiClient.get<string[]>("/chat-users/online");
    return response.data;
  }

  // Thêm user online từ token
  static async addUserOnlineFromToken(
    clientId: string
  ): Promise<{ success: boolean; userId?: string; message: string }> {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return { success: false, message: "No access token available" };
    }

    const response = await apiClient.post<{
      success: boolean;
      userId?: string;
      message: string;
    }>("/chat-users/online/token", {
      clientId,
    });

    return response.data;
  }

  // Lấy user ID từ token (không thêm vào online list)
  static async getUserIdFromToken(): Promise<{
    success: boolean;
    userId?: string;
    message: string;
  }> {
    const token = localStorage.getItem("access_token");
    if (!token) {
      return { success: false, message: "No access token available" };
    }

    const response = await apiClient.post<{
      success: boolean;
      userId?: string;
      message: string;
    }>("/chat-users/user-id", {});

    return response.data;
  }
}
