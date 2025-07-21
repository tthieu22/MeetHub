"use client";

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import { Spin } from "antd";
import { refreshAccessToken } from "@web/utils/auth.utils";

interface AuthGuardProps {
  children: React.ReactNode;
}

// Danh sách các trang không cần authentication
const PUBLIC_PAGES = ["/login", "/register", "/forgetPass"];

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUser = useUserStore((state) => state.currentUser);
  const isLoading = useUserStore((state) => state.isLoading);
  const hasRedirected = useRef(false);
  const isRefreshing = useRef(false);

  useEffect(() => {
    // Reset redirect flag khi pathname thay đổi
    hasRedirected.current = false;
  }, [pathname]);

  useEffect(() => {
    console.log("AuthGuard: Checking authentication", {
      isLoading,
      currentUser: !!currentUser,
      pathname,
      hasRedirected: hasRedirected.current,
    });

    // Nếu đang loading, không làm gì cả
    if (isLoading) {
      console.log("AuthGuard: Still loading, skipping");
      return;
    }

    // Kiểm tra nếu đang ở trang public thì cho phép truy cập
    if (PUBLIC_PAGES.includes(pathname)) {
      console.log("AuthGuard: Public page, allowing access");
      return;
    }

    // Tránh redirect nhiều lần
    if (hasRedirected.current) {
      console.log("AuthGuard: Already redirected, skipping");
      return;
    }

    // Kiểm tra token trong localStorage
    const token = localStorage.getItem("access_token");
    console.log("AuthGuard: Token found:", !!token);

    if (!token) {
      console.log("AuthGuard: No token, redirecting to login");
      hasRedirected.current = true;
      router.push("/login");
      return;
    }

    // Nếu có token nhưng chưa có user (có thể do token hết hạn hoặc không hợp lệ)
    if (!currentUser && token) {
      console.log(
        "AuthGuard: Token exists but no user, checking token validity"
      );
      try {
        // Kiểm tra token có hợp lệ không
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          console.log("AuthGuard: Token expired, trying to refresh...");

          // Thử refresh token trước khi redirect
          if (!isRefreshing.current) {
            isRefreshing.current = true;

            refreshAccessToken()
              .then((newToken) => {
                if (newToken) {
                  console.log(
                    "AuthGuard: Refresh token successful, staying on page"
                  );
                  // Refresh thành công, không cần redirect
                  isRefreshing.current = false;
                } else {
                  console.log(
                    "AuthGuard: Refresh token failed, redirecting to login"
                  );
                  localStorage.removeItem("access_token");
                  hasRedirected.current = true;
                  router.push("/login");
                }
              })
              .catch((error) => {
                console.log("AuthGuard: Refresh token error:", error);
                localStorage.removeItem("access_token");
                hasRedirected.current = true;
                router.push("/login");
              });
            return;
          }
          return;
        }

        // Token còn hạn nhưng chưa có user, có thể do UserProvider chưa load xong
        // Không redirect ngay, đợi UserProvider xử lý
        console.log(
          "AuthGuard: Token valid but no user, waiting for UserProvider"
        );
        return;
      } catch {
        console.log("AuthGuard: Invalid token, trying to refresh...");

        // Thử refresh token trước khi redirect
        if (!isRefreshing.current) {
          isRefreshing.current = true;

          refreshAccessToken()
            .then((newToken) => {
              if (newToken) {
                console.log(
                  "AuthGuard: Refresh token successful, staying on page"
                );
                isRefreshing.current = false;
              } else {
                console.log(
                  "AuthGuard: Refresh token failed, redirecting to login"
                );
                localStorage.removeItem("access_token");
                hasRedirected.current = true;
                router.push("/login");
              }
            })
            .catch((error) => {
              console.log("AuthGuard: Refresh token error:", error);
              localStorage.removeItem("access_token");
              hasRedirected.current = true;
              router.push("/login");
            });
          return;
        }
        return;
      }
    }

    console.log("AuthGuard: Authentication check complete");
  }, [currentUser, isLoading, router, pathname]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading || isRefreshing.current) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Nếu đang ở trang public, hiển thị children ngay lập tức
  if (PUBLIC_PAGES.includes(pathname)) {
    return <>{children}</>;
  }

  // Nếu chưa có user và không phải trang public, hiển thị loading
  if (!currentUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Nếu đã có user, hiển thị children
  return <>{children}</>;
}
