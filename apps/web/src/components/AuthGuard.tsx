"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import { Spin } from "antd";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const currentUser = useUserStore((state) => state.currentUser);
  const isLoading = useUserStore((state) => state.isLoading);

  useEffect(() => {
    // Kiểm tra nếu đang ở trang login thì không cần redirect
    if (
      typeof window !== "undefined" &&
      window.location.pathname === "/login"
    ) {
      return;
    }

    // Kiểm tra token trong localStorage
    const token = localStorage.getItem("access_token");

    if (!token && !isLoading) {
      // Nếu không có token và không đang loading, chuyển hướng về login
      router.push("/login");
    }
  }, [currentUser, isLoading, router]);

  // Hiển thị loading khi đang kiểm tra authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Nếu chưa có user, hiển thị loading
  if (!currentUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // Nếu đã có user, hiển thị children
  return <>{children}</>;
}
