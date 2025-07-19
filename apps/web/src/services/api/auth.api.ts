// Auth API Service for authentication
import axios from "../axios/customer.axios";

export interface LoginForm {
  email: string;
  password: string;
}
export interface RegisterForm {
  email: string;
  password: string;
  name: string;
  passwordagain: string;
}
type RegisterPayload = Omit<RegisterForm, "passwordagain">;
export interface LoginResponse {
  success: boolean;
  message?: string;
  errors?: string[];
  data: {
    access_token?: string;
  };
}
export interface RegisterResponse {
  success?: boolean;
  message?: string;
  errors?: string[];
  user?: User;
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

  async loginAPI(credentials: LoginForm) {
    const URL_BACKEND = `${this.baseURL}/api/auth/signIn`;
    
    // Sử dụng fetch thay vì axios để đảm bảo nhận cookies
    const response = await fetch(URL_BACKEND, {
      method: 'POST',
      credentials: 'include', // Quan trọng để nhận cookies
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    const data = await response.json();
    return data;
  }

  async registerAPI(userData: RegisterPayload) {
    const URL_BACKEND = `/api/register/register`;
    const response = await axios.post(URL_BACKEND, userData);
    return response;
  }
  async sendVerificationCodeAPI(payload: { email: string }) {
    const URL_BACKEND = `/api/register/send-code`;
    const response = await axios.post(URL_BACKEND, payload);
    return response;
  }
  async verifyCodeAPI(payload: { email: string; code: string }) {
    const URL_BACKEND = `/api/register/verify-code`;
    const response = await axios.post(URL_BACKEND, payload);
    return response;
  }

  async loginGG() {
    const URL_BACKEND = `/api/auth/google/redirect`;
    return await axios.get(URL_BACKEND);
  }
  async sendVerifiPassCodeAPI(payload: { email: string }) {
    const URL_BACKEND = `/api/password-reset/sendcode`;
    const response = await axios.post(URL_BACKEND, payload);
    return response;
  }
  async resetPasswordAPI(payload: {
    email: string;
    code: string;
    newPass: string;
    newPassAgain: string;
  }) {
    const URL_BACKEND = `/api/password-reset/verify`;
    const response = await axios.post(URL_BACKEND, payload);
    return response;
  }

  // async logout(): Promise<void> {
  //   return this.request<void>("/api/auth/logout", {
  //     method: "POST",
  //   });
  // }

  // async refreshToken(): Promise<{ access_token: string }> {
  //   return this.request<{ access_token: string }>("/api/auth/refresh", {
  //     method: "POST",
  //   });
  // }
}

// Create singleton instance
const authApiService = new AuthApiService();

export default authApiService;
