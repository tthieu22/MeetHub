import React, { useEffect, useRef } from "react";
import { Badge } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import ChatPopupList from "@web/components/chat-popup/ChatPopupList";
import { ChatRoom } from "@web/types/chat";
import { Socket } from "socket.io-client";

interface ChatIconProps {
  totalUnread: number;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  rooms: ChatRoom[];
  onRoomSelect: (roomId: string) => void;
  socket: Socket | null;
}

const ChatIcon: React.FC<ChatIconProps> = ({
  totalUnread,
  chatOpen,
  setChatOpen,
  rooms,
  onRoomSelect,
  socket,
}) => {
  const iconRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatOpen) return;
    const handleClick = (e: MouseEvent) => {
      const chatPopup = document.getElementById("chat-popup-header");
      if (
        chatPopup &&
        !chatPopup.contains(e.target as Node) &&
        iconRef.current &&
        !iconRef.current.contains(e.target as Node)
      ) {
        setChatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [chatOpen, setChatOpen]);

  useEffect(() => {
    if (!socket || !rooms || rooms.length === 0) return;
    rooms.forEach((room) => {
      if (room.roomId) {
        // socket.emit("get_room_online_members", { roomId: room.roomId });
      }
    });
  }, [rooms, socket]);

  return (
    <div style={{ position: "relative" }} ref={iconRef}>
      <Badge count={totalUnread} size="small">
        <span
          style={{
            fontSize: 20,
            padding: 10,
            borderRadius: "50%",
            background: chatOpen ? "rgb(196 218 249)" : "#ccc",
            cursor: "pointer",
            color: chatOpen ? "#1677ff" : "#000",
          }}
          onClick={() => setChatOpen(!chatOpen)}
        >
          <MessageOutlined />
        </span>
      </Badge>
      {chatOpen && (
        <div
          id="chat-popup-header"
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            width: 340,
            maxHeight: 420,
            background: "#fff",
            border: "1px solid #f0f0f0",
            borderRadius: 8,
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            zIndex: 2000,
            padding: 0,
            overflow: "hidden auto",
          }}
        >
          <div
            style={{
              fontWeight: 600,
              fontSize: 16,
              padding: "12px 16px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            Cuộc trò chuyện
          </div>
          <ChatPopupList rooms={rooms} onRoomSelect={onRoomSelect} />
        </div>
      )}
    </div>
  );
};

export default ChatIcon;
