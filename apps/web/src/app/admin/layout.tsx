"use client";

import React, { useState } from "react";
import {
  Layout as AntLayout,
  Menu,
  Typography,
  Avatar,
  Space,
  theme,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import HeaderCus from "@web/components/Header";

const { Header, Sider, Content } = AntLayout;
const { Title } = Typography;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: "/admin",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: "Quản lý người dùng",
    },
    {
      key: "/admin/rooms",
      icon: <TeamOutlined />,
      label: "Quản lý phòng họp",
    },
    {
      key: "/admin/bookings",
      icon: <CalendarOutlined />,
      label: "Quản lý booking",
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key === "logout") {
      router.push("/login");
    } else {
      router.push(key);
    }
  };

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          background: colorBgContainer,
          borderRight: "1px solid #f0f0f0",
        }}
      >
        <div
          style={{
            padding: 16,
            textAlign: "center",
            borderBottom: "1px solid #f0f0f0",
            marginBottom: 16,
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#1890ff" }}>
            {collapsed ? "MH" : "MeetHub Admin"}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ border: "none" }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            padding: 16,
            borderTop: "1px solid #f0f0f0",
            background: colorBgContainer,
          }}
        >
          <Menu
            mode="inline"
            items={[
              {
                key: "logout",
                icon: <LogoutOutlined />,
                label: "Đăng xuất",
              },
            ]}
            onClick={handleMenuClick}
            style={{ border: "none" }}
          />
        </div>
      </Sider>
      <AntLayout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#1890ff",
              cursor: "pointer",
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? "☰" : "✕"}
          </div>
          <Space>
            <HeaderCus />
          </Space>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  );
}
