import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
  } | null;
}

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    console.log('refreshAccessToken: Bắt đầu refresh token');
    
    const response = await axios.post<RefreshTokenResponse>(
      `${API_URL}/api/auth/refresh-token`,
      {},
      {
        withCredentials: true, // Quan trọng để gửi cookie
      }
    );

    console.log('refreshAccessToken: Response received:', response.data);

    if (response.data?.success && response.data?.data?.access_token) {
      const newToken = response.data.data.access_token;
      
      // Lưu token mới vào localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem("access_token", newToken);
        console.log('refreshAccessToken: Token mới đã được lưu');
      }
      
      return newToken;
    } else {
      console.log('refreshAccessToken: Response không hợp lệ:', response.data);
    }
    
    return null;
  } catch (error: any) {
    console.error('refreshAccessToken: Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    return null;
  }
};

export const logoutUser = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
};

export const getStoredToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem("access_token");
  }
  return null;
};

export const setStoredToken = (token: string) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem("access_token", token);
  }
}; 