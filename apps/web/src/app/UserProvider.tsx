"use client";

import { useEffect } from "react";
import { useUserStore } from "@web/store/user.store";

export function UserProvider() {
  useEffect(() => {
    const setLoading = useUserStore.getState().setLoading;

    // Set loading true khi bắt đầu
    setLoading(true);

    // Kiểm tra token trong localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");

      if (token) {
        try {
          // Decode JWT token để lấy thông tin user
          const payload = JSON.parse(atob(token.split(".")[1]));

          // Set user từ token
          useUserStore.getState().setCurrentUser({
            _id: payload._id,
            email: payload.email || payload.name || "user@example.com",
            username: payload.name || payload.email || "user",
            avatar: "",
          });

          console.log("[UserProvider] User loaded from token:", payload);
        } catch (error) {
          console.error("[UserProvider] Error decoding token:", error);
          // Nếu token không hợp lệ, xóa nó
          localStorage.removeItem("access_token");
        }
      } else {
        console.log("[UserProvider] No token found in localStorage");
      }
    }

    // Set loading false sau khi hoàn thành
    setLoading(false);
  }, []);

  return null;
}
