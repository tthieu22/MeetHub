import axios from 'axios';
import { refreshAccessToken, logoutUser } from '@web/utils/auth.utils';
import { useUserStore } from '@web/store/user.store';

const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: NESTJS_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token: string) => {
  if (token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.Authorization;
  }
};

// Biến để theo dõi việc đang refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// Thêm request interceptor để đảm bảo token được thêm vào header
api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm response interceptor để xử lý lỗi và tự động refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 và chưa thử refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh, thêm request vào queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Sử dụng utility function để refresh token
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          // Cập nhật header cho request gốc và api instance
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          api.defaults.headers.Authorization = `Bearer ${newToken}`;
          
          // Xử lý queue
          processQueue(null, newToken);
          
          // Thực hiện lại request gốc
          return api(originalRequest);
        } else {
          // Refresh token thất bại, logout user
          logoutUser();
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh token thất bại, logout user
        logoutUser();
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);