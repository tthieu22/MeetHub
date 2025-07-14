import axios from "axios";
const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

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
  (error) => {
    // Giữ nguyên lỗi để xử lý trong try...catch
    if (error.response && error.response.data) return error.response.data;
    return Promise.reject(error);
  }
);
export default instance;
