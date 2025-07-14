// Invitation API Service
import { notification } from "antd";

export interface Invitation {
  invitationId: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
    avatarURL?: string;
  };
  receiver?: {
    _id: string;
    name: string;
    email: string;
    avatarURL?: string;
  };
  message: string;
  status?: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt?: string;
  updatedAt?: string;
}

export interface CreateInvitationRequest {
  receiverId: string;
  message?: string;
}

export interface RespondInvitationRequest {
  action: "accept" | "decline";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class InvitationApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("access_token") || localStorage.getItem("token")
      );
    }
    return null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to process request";
      notification.error({
        message: "Lỗi API",
        description: errorMessage,
        placement: "topRight",
        duration: 5,
      });

      return {
        success: false,
        message: errorMessage,
      } as ApiResponse<T>;
    }
  }

  /**
   * Gửi lời mời chat
   */
  async createInvitation(
    request: CreateInvitationRequest
  ): Promise<ApiResponse<{ invitationId: string; message: string }>> {
    return this.request<{ invitationId: string; message: string }>(
      "/api/chat-invitations",
      {
        method: "POST",
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Lấy danh sách lời mời đã nhận
   */
  async getReceivedInvitations(): Promise<ApiResponse<Invitation[]>> {
    return this.request<Invitation[]>("/api/chat-invitations/received", {
      method: "GET",
    });
  }

  /**
   * Lấy danh sách lời mời đã gửi
   */
  async getSentInvitations(): Promise<ApiResponse<Invitation[]>> {
    return this.request<Invitation[]>("/api/chat-invitations/sent", {
      method: "GET",
    });
  }

  /**
   * Xử lý lời mời (accept/decline)
   */
  async respondToInvitation(
    invitationId: string,
    action: "accept" | "decline"
  ): Promise<ApiResponse<{ conversationId?: string; message: string }>> {
    return this.request<{ conversationId?: string; message: string }>(
      `/api/chat-invitations/${invitationId}/respond`,
      {
        method: "PUT",
        body: JSON.stringify({ action }),
      }
    );
  }

  /**
   * Hủy lời mời
   */
  async cancelInvitation(
    invitationId: string
  ): Promise<ApiResponse<{ message: string }>> {
    return this.request<{ message: string }>(
      `/api/chat-invitations/${invitationId}`,
      {
        method: "DELETE",
      }
    );
  }
}

// Create singleton instance
const invitationApiService = new InvitationApiService();

export default invitationApiService;
