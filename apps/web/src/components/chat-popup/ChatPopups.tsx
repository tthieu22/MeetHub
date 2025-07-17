import React, { useState } from "react";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import ChatPopupWindow from "./ChatPopupWindow";
import type { ChatRoom } from "@web/types/chat";
import { webSocketService } from "@web/services/websocket/websocket.service";

// Nút thu nhỏ popup chat
const ChatPopupMinimizedButton = ({
  conversationId,
  room,
  onOpen,
  onHide,
  index,
}: {
  conversationId: string;
  room: Pick<ChatRoom, "name" | "lastMessage">;
  onOpen: (id: string) => void;
  onHide: (id: string) => void;
  index: number;
}) => (
  <div
    key={conversationId}
    style={{
      position: "fixed",
      bottom: 24 + index * 60,
      right: 24,
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <button
      style={{
        borderRadius: "50%",
        width: 48,
        height: 48,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "1px solid #eee",
        cursor: "pointer",
        position: "relative",
      }}
      onClick={() => onOpen(conversationId)}
      title={room.name}
    >
      <span style={{ fontSize: 14, fontWeight: 600 }}>
        {room.name?.[0] || "C"}
      </span>
      {/* Nút X */}
      <span
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: "#f5f5f5",
          color: "#888",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onHide(conversationId);
        }}
        title="Ẩn nút thu nhỏ"
      >
        ×
      </span>
    </button>
  </div>
);

const ChatPopups: React.FC = () => {
  const rooms = useChatStore((state) => state.rooms);
  const openedPopups = useChatStore((state) => state.openedPopups);
  const addPopup = useChatStore((state) => state.addPopup);
  const removePopup = useChatStore((state) => state.removePopup);
  const updateUnreadCount = useChatStore((state) => state.updateUnreadCount);
  const socket = useWebSocketStore((state) => state.socket);
  const [closedPopups, setClosedPopups] = useState<string[]>([]);

  // Khi đóng popup, thêm vào closedPopups
  const handleClosePopup = (conversationId: string) => {
    removePopup(conversationId);
    setClosedPopups((prev) => Array.from(new Set([...prev, conversationId])));
    if (socket && socket.connected) {
      socket.emit("leave_room", { roomId: conversationId });
    }
  };
  // Khi mở lại popup, xóa khỏi closedPopups
  const handleOpenPopup = (conversationId: string) => {
    addPopup(conversationId);
    setClosedPopups((prev) => prev.filter((id) => id !== conversationId));
  };

  return (
    <>
      {/* Render các popup chat ở góc màn hình */}
      {openedPopups.map((conversationId, idx) =>
        typeof conversationId === "string"
          ? ((() => {
              webSocketService.emitMarkRoomRead(conversationId);
              // Reset local unread count về 0 khi mở popup
              updateUnreadCount(conversationId, 0);
              return null;
            })(),
            (
              <ChatPopupWindow
                key={conversationId}
                conversationId={conversationId}
                index={idx}
                onClose={() => handleClosePopup(conversationId)}
              />
            ))
          : null
      )}
      {/* Nút thu nhỏ cho các popup đã đóng */}
      {closedPopups.map((conversationId, i) => {
        const room = rooms.find(
          (r) => r.lastMessage?.conversationId === conversationId
        );
        if (!room) return null;
        return (
          <ChatPopupMinimizedButton
            key={conversationId}
            conversationId={conversationId}
            room={room}
            onOpen={handleOpenPopup}
            onHide={(id) =>
              setClosedPopups((prev) => prev.filter((cid) => cid !== id))
            }
            index={i}
          />
        );
      })}
    </>
  );
};

export default ChatPopups;
