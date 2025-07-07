import { apiClient } from "../client";
import { User } from "../types";

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
}
