import axios from "axios";
import { refreshAccessToken, logoutUser } from "@web/utils/auth.utils";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

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

instance.interceptors.request.use(
  function (config) {
    const token = window.localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = "Bearer " + token;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    if (response.data) {
      return response.data;
    }
    return response;
  },
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
          return instance(originalRequest);
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
          // Cập nhật header cho request gốc
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Xử lý queue
          processQueue(null, newToken);
          
          // Thực hiện lại request gốc
          return instance(originalRequest);
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

    // Giữ nguyên lỗi để xử lý trong try...catch
    if (error.response && error.response.data) return error.response.data;
    return Promise.reject(error);
  }
);

export default instance;
