"use client";
import "antd/dist/reset.css";
import "@web/style/globals.css";
import React, { useState } from "react";
import { Layout as AntLayout, Menu, Typography, theme } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  DashboardOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import ChatPopups from "@web/components/chat-popup/ChatPopups";
import ChatWithAdminButton from "@web/components/ChatWithAdminButton";
import UserAvatar from "@web/components/UserAvatar";
import { useUserStore } from "@web/store/user.store";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import ChatIcon from "@web/components/ChatIcon";
import Notification from "@web/components/IconNotification";
import { useEffect } from "react";
import { WS_EVENTS } from "@web/constants/websocket.events";

const { Sider, Content } = AntLayout;
const { Title } = Typography;

export default function Layout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  const { currentUser } = useUserStore();
  const rooms = useChatStore((state) => state.rooms);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const [chatOpen, setChatOpen] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);
  const addPopup = useChatStore((state) => state.addPopup);
  const setCurrentRoomId = useChatStore((state) => state.setCurrentRoomId);
  const isConnected = useWebSocketStore((state) => state.isConnected);

  const totalUnread = Object.values(unreadCounts || {}).reduce(
    (a, b) => a + b,
    0
  );

  // Load rooms khi component mount và WebSocket đã kết nối
  useEffect(() => {
    if (isConnected && socket && rooms.length === 0) {
      socket.emit(WS_EVENTS.GET_ROOMS);
    }
  }, [isConnected, socket, rooms.length]);

  const menuItems = [
    { key: "/admin", icon: <DashboardOutlined />, label: "Dashboard" },
    {
      key: "/admin/users",
      icon: <UserOutlined />,
      label: "Quản lý người dùng",
    },
    { key: "/admin/rooms", icon: <TeamOutlined />, label: "Quản lý phòng họp" },
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
        collapsedWidth={64}
        style={{
          background: "#fff",
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
            background: "#fff",
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
        <header
          style={{
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            padding: "0 24px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#1890ff",
              cursor: "pointer",
            }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: "rgb(204, 204, 204)",
                cursor: "pointer",
                color: "rgb(0, 0, 0)",
                display: "flex",
                fontSize:20,
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                transition: "background 0.2s ease-in-out",
              }}
              onClick={() => router.push("/")} 
              title="Về trang chủ"
            >
              <HomeOutlined />
            </div>

            <Notification />
            {currentUser && (
              <ChatIcon
                totalUnread={totalUnread}
                chatOpen={chatOpen}
                setChatOpen={setChatOpen}
                rooms={rooms}
                onRoomSelect={(roomId) => {
                  const room = rooms.find((r) => r.roomId === roomId);
                  if (room?.roomId) {
                    addPopup(room.roomId);
                    setCurrentRoomId(room.roomId);
                  }
                }}
                socket={socket}
              />
            )}
            {currentUser && <ChatWithAdminButton />}
            {currentUser && <UserAvatar />}

            {/* Chat popups fixed */}
            <ChatPopups />
          </div>
        </header>

        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            background: "#fff",
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
