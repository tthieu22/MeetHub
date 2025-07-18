"use client";
import { useSearchParams } from "next/navigation";
import { Result, Button } from "antd";
import { useRouter } from "next/navigation";

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "403";
  const title = searchParams.get("title") || "Bạn không có quyền truy cập trang này";
  const router = useRouter();

  return (
    <Result
      status={status}
      title={status}
      subTitle={title}
      extra={
        <Button type="primary" onClick={() => router.push("/")}>
          Quay về trang chủ
        </Button>
      }
    />
  );
}
