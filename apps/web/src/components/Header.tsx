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

// ------------------- Header Component -------------------

const Header = memo(() => {
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
        <Logo onClick={handleLogoClick} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
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

Header.displayName = "Header";

export default Header;
