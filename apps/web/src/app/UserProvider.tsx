"use client";

import { useEffect } from "react";
import { useUserStore } from "@web/store/user.store";

export function UserProvider() {
  useEffect(() => {
    const { setLoading, setCurrentUser, setAuthenticated } =
      useUserStore.getState();

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
          const user = {
            _id: payload._id,
            email: payload.email || payload.name || "user@example.com",
            username: payload.name || payload.email || "user",
            avatar: "",
            role: payload.role, // thêm dòng này
          };

          setCurrentUser(user);
          setAuthenticated(true);
        } catch {
          // Nếu token không hợp lệ, xóa nó
          localStorage.removeItem("access_token");
          setCurrentUser(null);
          setAuthenticated(false);
        }
      } else {
        setCurrentUser(null);
        setAuthenticated(false);
      }
    }

    // Set loading false sau khi hoàn thành
    setLoading(false);
  }, []);

  return null;
}
