"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import { Spin } from "antd";

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

  useEffect(() => {
    // Nếu đang loading, không làm gì cả
    if (isLoading) {
      return;
    }

    // Kiểm tra nếu đang ở trang public thì cho phép truy cập
    if (PUBLIC_PAGES.includes(pathname)) {
      return;
    }

    // Kiểm tra token trong localStorage
    const token = localStorage.getItem("access_token");

    if (!token) {
      router.push("/login");
      return;
    }

    // Nếu có token nhưng chưa có user (có thể do token hết hạn hoặc không hợp lệ)
    if (!currentUser && token) {
      try {
        // Kiểm tra token có hợp lệ không
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp && payload.exp < currentTime) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }

        // Token còn hạn nhưng chưa có user, có thể do UserProvider chưa load xong
        return;
      } catch {
        localStorage.removeItem("access_token");
        router.push("/login");
        return;
      }
    }
  }, [currentUser, isLoading, router, pathname]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
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
