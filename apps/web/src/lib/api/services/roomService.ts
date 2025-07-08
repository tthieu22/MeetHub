import { apiClient } from "@web/lib/api/client";
import {
  ChatRoom,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomMember,
  ApiResponse,
} from "../types";

export class RoomService {
  // 10. Tạo phòng mới (1-1 hoặc group)
  static async createRoom(
    data: CreateRoomRequest
  ): Promise<ApiResponse<ChatRoom>> {
    return await apiClient.post<ChatRoom>("/rooms", data);
  }

  // 11. Danh sách phòng của user
  static async getRooms(): Promise<ApiResponse<ChatRoom[]>> {
    return await apiClient.get<ChatRoom[]>("/rooms");
  }

  // 12. Thông tin chi tiết 1 phòng
  static async getRoom(roomId: string): Promise<ApiResponse<ChatRoom>> {
    return await apiClient.get<ChatRoom>(`/rooms/${roomId}`);
  }

  // 13. Cập nhật tên, mô tả phòng
  static async updateRoom(
    roomId: string,
    data: UpdateRoomRequest
  ): Promise<ApiResponse<ChatRoom>> {
    return await apiClient.put<ChatRoom>(`/rooms/${roomId}`, data);
  }

  // 14. Xóa phòng chat (admin)
  static async deleteRoom(roomId: string): Promise<ApiResponse<void>> {
    return await apiClient.delete(`/rooms/${roomId}`);
  }

  // 15. Tham gia phòng chat (group)
  static async joinRoom(roomId: string): Promise<ApiResponse<void>> {
    return await apiClient.post(`/rooms/${roomId}/join`);
  }

  // 16. Rời khỏi phòng chat
  static async leaveRoom(roomId: string): Promise<ApiResponse<void>> {
    return await apiClient.post(`/rooms/${roomId}/leave`);
  }

  // 17. Thêm user vào group chat
  static async addMember(
    roomId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.post(`/rooms/${roomId}/add-member`, { userId });
  }

  // 18. Xoá người ra khỏi phòng
  static async removeMember(
    roomId: string,
    userId: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete(`/rooms/${roomId}/remove-member/${userId}`);
  }

  // 19. Lấy danh sách user trong phòng
  static async getRoomMembers(
    roomId: string
  ): Promise<ApiResponse<RoomMember[]>> {
    return await apiClient.get<RoomMember[]>(`/rooms/${roomId}/members`);
  }

  // 22. Đánh dấu toàn bộ tin nhắn trong phòng là đã đọc
  static async markAllAsRead(roomId: string): Promise<ApiResponse<void>> {
    return await apiClient.put(`/rooms/${roomId}/read-all`);
  }

  // 23. Lấy số lượng tin nhắn chưa đọc trong phòng
  static async getUnreadCount(roomId: string): Promise<ApiResponse<number>> {
    return await apiClient.get<number>(`/rooms/${roomId}/unread-count`);
  }
}
