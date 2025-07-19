"use client";
import React, { memo, useCallback, useState } from "react";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { useRouter } from "next/navigation";
import { useChatStore } from "@web/store/chat.store";
import ChatPopups from "@web/components/chat-popup/ChatPopups";
import ChatWithAdminButton from "@web/components/ChatWithAdminButton";
// import ConnectionStatus from "@web/app/ConnectionStatus";
import Logo from "@web/components/Logo";
import ChatIcon from "@web/components/ChatIcon";
import UserAvatar from "@web/components/UserAvatar";
import Notification from "./IconNotification";
import { HomeOutlined, SettingOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";

// ------------------- Header Component -------------------

const HeaderCus = memo(() => {
  const { currentUser } = useUserStore();
  const router = useRouter();
  const rooms = useChatStore((state) => state.rooms);
  const unreadCounts = useChatStore((state) => state.unreadCounts);
  const [chatOpen, setChatOpen] = useState(false);
  const socket = useWebSocketStore((state) => state.socket);
  const addPopup = useChatStore((state) => state.addPopup);
  const setCurrentRoomId = useChatStore((state) => state.setCurrentRoomId);

  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);

  // Đếm tổng số tin nhắn chưa đọc
  const totalUnread = Object.values(unreadCounts || {}).reduce(
    (a, b) => a + b,
    0
  );

  return (
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
      <div style={{ display: "flex", alignItems: "center" }}>
        <Tooltip title="Về trang chủ" placement="bottom">  
          <Logo onClick={handleLogoClick} />
        </Tooltip>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Tooltip title={currentUser?.role === "admin" ? "Về trang quản trị" : "Về trang chủ"} placement="bottom"> 
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
            onClick={() => router.push(currentUser?.role === "admin" ? "/admin" : "/")} 
            title={currentUser?.role === "admin" ? "Về trang quản trị" : "Về trang chủ"}
          >
            {currentUser?.role === "admin" ? <SettingOutlined /> : <HomeOutlined />}
          </div>
        </Tooltip>
        {/* Icon chat */}
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
        <Notification /> 
        {/* Nút chat với admin */}
        {currentUser && <ChatWithAdminButton />}
        {/* {currentUser && <ConnectionStatus />} */}
        {currentUser && <UserAvatar />}
      </div>
      {/* Render các popup chat ở góc màn hình */}
      <ChatPopups />
    </header>
  );
});

HeaderCus.displayName = "Header";

export default HeaderCus;
