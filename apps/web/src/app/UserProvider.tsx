"use client";

import { useEffect } from "react";
import { useUserStore } from "@web/store/user.store";
import { refreshAccessToken } from "@web/utils/auth.utils";

export function UserProvider() {
  useEffect(() => {
    const { setLoading, setCurrentUser, setAuthenticated } =
      useUserStore.getState();

    // Set loading true khi bắt đầu
    setLoading(true);

    const initializeAuth = async () => {
      // Kiểm tra token trong localStorage
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");

        if (token) {
          try {
            // Decode JWT token để lấy thông tin user
            const payload = JSON.parse(atob(token.split(".")[1]));

            // Kiểm tra token có hết hạn chưa
            const currentTime = Math.floor(Date.now() / 1000);

            if (payload.exp && payload.exp < currentTime) {
              console.log("Token đã hết hạn, thử refresh...");

              // Thử refresh token
              const newToken = await refreshAccessToken();

              if (newToken) {
                console.log("Refresh token thành công");
                // Decode token mới
                const newPayload = JSON.parse(atob(newToken.split(".")[1]));
                const user = {
                  _id: newPayload._id,
                  email:
                    newPayload.email || newPayload.name || "user@example.com",
                  username: newPayload.name || newPayload.email || "user",
                  avatar: "",
                  role: newPayload.role,
                };

                setCurrentUser(user);
                setAuthenticated(true);
              } else {
                console.log("Refresh token thất bại, logout user");
                localStorage.removeItem("access_token");
                setCurrentUser(null);
                setAuthenticated(false);
              }
            } else {
              // Token còn hạn, set user
              const user = {
                _id: payload._id,
                email: payload.email || payload.name || "user@example.com",
                username: payload.name || payload.email || "user",
                avatar: "",
                role: payload.role,
              };

              setCurrentUser(user);
              setAuthenticated(true);
            }
          } catch (error) {
            console.error("Lỗi xử lý token:", error);
            // Nếu token không hợp lệ, thử refresh
            const newToken = await refreshAccessToken();

            if (newToken) {
              console.log("Refresh token thành công sau lỗi parse");
              const newPayload = JSON.parse(atob(newToken.split(".")[1]));
              const user = {
                _id: newPayload._id,
                email:
                  newPayload.email || newPayload.name || "user@example.com",
                username: newPayload.name || newPayload.email || "user",
                avatar: "",
                role: newPayload.role,
              };

              setCurrentUser(user);
              setAuthenticated(true);
            } else {
              localStorage.removeItem("access_token");
              setCurrentUser(null);
              setAuthenticated(false);
            }
          }
        } else {
          setCurrentUser(null);
          setAuthenticated(false);
        }
      }

      // Set loading false sau khi hoàn thành
      setLoading(false);
    };

    initializeAuth();
  }, []);

  return null;
}
