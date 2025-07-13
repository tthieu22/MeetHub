import { message } from "antd";

export interface User {
  userId: string;
  name: string;
  email: string;
  avatar: string | null;
  chated?: boolean;
  roomId?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  totalPages?: number;
  currentPage?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

class UsersApiService {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load users";
      message.error(errorMessage);

      return {
        success: false,
        message: errorMessage,
      } as ApiResponse<T>;
    }
  }

  async getUsers(params?: PaginationParams): Promise<ApiResponse<User[]>> {
    const queryString = params
      ? `?${new URLSearchParams(params as Record<string, string>).toString()}`
      : "";
    return this.request<User[]>(`/api/chat-users${queryString}`, {
      method: "GET",
    });
  }
}

// Create singleton instance
const usersApiService = new UsersApiService();

export default usersApiService;
