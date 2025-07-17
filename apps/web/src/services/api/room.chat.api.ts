import axios from "../axios/customer.axios";
import { UsersOnline, ChatRoom } from "@web/types/chat";

// Sử dụng Partial<ChatRoom> cho UpdateRoomDto, object cho CreateRoomDto

type CreateRoomDto = object;
type UpdateRoomDto = Partial<ChatRoom>;

interface UserItem {
  userId: string;
  name: string;
  email: string;
  avatarURL?: string;
}

class RoomChatApiService {
  async getRoomMembers(
    roomId: string
  ): Promise<{ success: boolean; members: UsersOnline[] }> {
    const res = await axios.get<{ success: boolean; members: UsersOnline[] }>(
      `/api/chat/rooms/${roomId}/members`
    );
    return res.data;
  }

  async getRooms(): Promise<ChatRoom[]> {
    const res = await axios.get<{ data: ChatRoom[] }>(`/api/chat/rooms`);
    return res.data.data;
  }

  async getRoom(roomId: string): Promise<ChatRoom> {
    const res = await axios.get<{ data: ChatRoom }>(
      `/api/chat/rooms/${roomId}`
    );
    return res.data.data;
  }

  async createRoom(data: CreateRoomDto): Promise<ChatRoom> {
    const res = await axios.post<{ data: ChatRoom }>(`/api/chat/rooms`, data);
    return res.data.data;
  }

  async updateRoom(roomId: string, data: UpdateRoomDto): Promise<ChatRoom> {
    const res = await axios.put<{ data: ChatRoom }>(
      `/api/chat/rooms/${roomId}`,
      data
    );
    return res.data.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await axios.delete(`/api/chat/rooms/${roomId}`);
  }

  async joinRoom(roomId: string): Promise<unknown> {
    const res = await axios.post(`/api/chat/rooms/${roomId}/join`);
    return res.data;
  }

  async leaveRoom(roomId: string): Promise<unknown> {
    const res = await axios.post(`/api/chat/rooms/${roomId}/leave`);
    return res.data;
  }

  async addMember(roomId: string, userId: string): Promise<unknown> {
    const res = await axios.post(`/api/chat/rooms/${roomId}/add-member`, {
      userId,
    });
    return res.data;
  }

  async removeMember(roomId: string, userId: string): Promise<unknown> {
    const res = await axios.delete(
      `/api/chat/rooms/${roomId}/remove-member/${userId}`
    );
    return res.data;
  }

  async markAllAsRead(roomId: string): Promise<unknown> {
    const res = await axios.put(`/api/chat/rooms/${roomId}/read-all`);
    return res.data;
  }

  async getUnreadCount(roomId: string): Promise<number> {
    const res = await axios.get<{ data: { unreadCount: number } }>(
      `/api/chat/rooms/${roomId}/unread-count`
    );
    return res.data.data.unreadCount;
  }

  async getAllUsers(
    page = 1,
    limit = 20,
    conversationId?: string
  ): Promise<{
    success: boolean;
    data: UserItem[];
    total: number;
    currentPage: number;
    totalPages: number;
  }> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      ...(conversationId ? { conversationId } : {}),
    });
    console.log(params);
    const res = await axios.get(
      `/api/chat/rooms/all-users?${params.toString()}`
    );
    return res.data;
  }

  async addMembers(
    roomId: string,
    userIds: string[]
  ): Promise<{ success: boolean; added: number }> {
    const res = await axios.post(`/api/chat/rooms/${roomId}/add-members`, {
      userIds,
    });
    return res.data;
  }

  async removeMembers(
    roomId: string,
    userIds: string[]
  ): Promise<{ success: boolean; removed: number }> {
    const res = await axios.post(`/api/chat/rooms/${roomId}/remove-members`, {
      userIds,
    });
    return res.data;
  }
}

export const roomChatApiService = new RoomChatApiService();
