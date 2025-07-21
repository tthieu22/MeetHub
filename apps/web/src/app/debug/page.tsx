"use client";

import React from "react";
import { Layout, Typography } from "antd";
import DebugToken from "@web/components/DebugToken";
import TestRefreshToken from "@web/components/TestRefreshToken";

const { Content } = Layout;
const { Title } = Typography;

export default function DebugPage() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "24px" }}>
        <Title level={2}>Debug Token & Refresh</Title>
        <p>Trang này dùng để debug và test tính năng refresh token.</p>

        <DebugToken />
        <TestRefreshToken />

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            backgroundColor: "#f5f5f5",
            borderRadius: "8px",
          }}
        >
          <Title level={4}>Hướng dẫn debug:</Title>
          <ol>
            <li>Đăng nhập để lấy token</li>
            <li>Quan sát thời gian còn lại của token</li>
            <li>Đợi token hết hạn hoặc dùng DevTools để xóa token</li>
            <li>Test refresh token tự động hoặc thủ công</li>
            <li>Kiểm tra console để xem logs</li>
          </ol>
        </div>
      </Content>
    </Layout>
  );
}
