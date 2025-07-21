"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";

export function useRequireRole(role: string) {
  const user = useUserStore((state) => state.currentUser);
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);


  useEffect(() => {
    // Nếu user chưa xác thực xong (undefined), chờ
    if (user === undefined) return;
    // Nếu không có user hoặc sai role, redirect
    if (!user || user.role !== role) {
      router.replace(
        `/errorPage?status=403&title=Bạn không có quyền truy cập trang này`
      );
      return;
    }
    // Đúng quyền, cho phép render
    setIsChecking(false);
  }, [user, role, router]);

  // Nếu đang kiểm tra quyền, tạm thời return loading (hoặc null)
  if (isChecking) {
    // Có thể return spinner hoặc null
    // return <div>Đang kiểm tra quyền truy cập...</div>;
    return null;
  }
}