"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";

export function useRequireRole(role: string) {
  const user = useUserStore((state) => state.currentUser);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== role) {
      router.replace(
        `/errorPage?status=403&title=Bạn không có quyền truy cập trang này`
      );
    }
  }, [user, role, router]);
}