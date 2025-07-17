import axios from 'axios';

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

// Thêm request interceptor để đảm bảo token được thêm vào header
api.interceptors.request.use(
  (config) => {
    const token = api.defaults.headers.Authorization;
    if (token) {
      config.headers.Authorization = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Thêm response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Truy cập không được phép - có thể token không hợp lệ');
      // Bạn có thể thêm logic xử lý lỗi 401, ví dụ như đăng xuất người dùng
    }
    return Promise.reject(error);
  }
);