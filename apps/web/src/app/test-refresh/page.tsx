"use client";

import React, { useState } from "react";
import {
  Layout,
  Typography,
  Button,
  Card,
  Space,
  notification,
  Alert,
} from "antd";
import { refreshAccessToken, getStoredToken } from "@web/utils/auth.utils";

const { Content } = Layout;
const { Title } = Typography;

export default function TestRefreshPage() {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>("");
  const [api, contextHolder] = notification.useNotification();

  const testRefreshToken = async () => {
    setLoading(true);
    setTestResult("Đang test...");

    try {
      // 1. Kiểm tra token hiện tại
      const currentToken = getStoredToken();
      setTestResult(
        (prev) =>
          prev + "\n1. Token hiện tại: " + (currentToken ? "Có" : "Không")
      );

      if (currentToken) {
        try {
          const payload = JSON.parse(atob(currentToken.split(".")[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          const timeLeft = payload.exp - currentTime;
          setTestResult(
            (prev) => prev + "\n2. Token expires in: " + timeLeft + " seconds"
          );
        } catch (error) {
          setTestResult((prev) => prev + "\n2. Lỗi parse token: " + error);
        }
      }

      // 2. Test refresh token
      setTestResult((prev) => prev + "\n3. Gọi refresh token API...");
      const newToken = await refreshAccessToken();

      if (newToken) {
        setTestResult((prev) => prev + "\n✅ Refresh token thành công!");
        api.success({
          message: "Refresh token thành công",
          description: "Token mới đã được cấp",
          placement: "topRight",
        });
      } else {
        setTestResult((prev) => prev + "\n❌ Refresh token thất bại");
        api.error({
          message: "Refresh token thất bại",
          description: "Không thể cấp token mới",
          placement: "topRight",
        });
      }

      // 3. Test API call với token mới
      setTestResult((prev) => prev + "\n4. Test API call với token mới...");
      const response = await fetch("http://localhost:8000/api/users/profile", {
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
        },
      });

      if (response.ok) {
        setTestResult((prev) => prev + "\n✅ API call thành công!");
      } else {
        setTestResult(
          (prev) => prev + "\n❌ API call thất bại: " + response.status
        );
      }
    } catch (error) {
      setTestResult((prev) => prev + "\n❌ Lỗi: " + error);
      api.error({
        message: "Test thất bại",
        description: String(error),
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    localStorage.removeItem("access_token");
    setTestResult("Đã xóa token");
    api.success({
      message: "Đã xóa token",
      placement: "topRight",
    });
  };

  const checkCookies = () => {
    setTestResult("Cookies: " + document.cookie);
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "24px" }}>
        {contextHolder}
        <Title level={2}>Test Refresh Token</Title>

        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Hướng dẫn"
            description="Trang này dùng để test refresh token. Đảm bảo đã đăng nhập trước khi test."
            type="info"
            showIcon
          />

          <Card title="Actions">
            <Space>
              <Button
                type="primary"
                onClick={testRefreshToken}
                loading={loading}
              >
                Test Refresh Token
              </Button>
              <Button onClick={clearToken}>Xóa Token</Button>
              <Button onClick={checkCookies}>Kiểm tra Cookies</Button>
            </Space>
          </Card>

          <Card title="Kết quả Test">
            <pre
              style={{
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "4px",
                whiteSpace: "pre-wrap",
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {testResult || "Chưa có kết quả test"}
            </pre>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
}
