// Auth API Service for authentication
import { message } from "antd";

export interface LoginForm {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
  avatar: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class AuthApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      const config: RequestInit = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      };

      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error("Đăng nhập thất bại");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Auth API request failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Đăng nhập thất bại";
      message.error(errorMessage);
      throw error;
    }
  }

  async login(credentials: LoginForm): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/signIn", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<LoginResponse> {
    return this.request<LoginResponse>("/api/auth/signUp", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>("/api/auth/logout", {
      method: "POST",
    });
  }

  async refreshToken(): Promise<{ access_token: string }> {
    return this.request<{ access_token: string }>("/api/auth/refresh", {
      method: "POST",
    });
  }
}

// Create singleton instance
const authApiService = new AuthApiService();

export default authApiService;
