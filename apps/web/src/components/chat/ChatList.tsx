"use client";

import React from "react";
import { List, Typography } from "antd";
import { ChatRoom } from "@web/types/chat";
import ChatRoomItem from "./ChatRoomItem";

const { Text } = Typography;

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId?: string;
  onRoomSelect?: (roomId: string) => void;
  unreadCounts?: Record<string, number>;
}

function ChatList({
  rooms,
  selectedRoomId,
  onRoomSelect,
  unreadCounts = {},
}: ChatListProps) {
  const loading = false;
  const error = null;

  if (loading) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span>Đang tải danh sách phòng chat...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 16,
          color: "red",
          textAlign: "center",
          backgroundColor: "#fff2f0",
          border: "1px solid #ffccc7",
          borderRadius: "6px",
          margin: "8px",
        }}
      >
        <Text type="danger">{error}</Text>
      </div>
    );
  }

  if (!rooms || rooms.length === 0) {
    return (
      <div
        style={{
          padding: 16,
          textAlign: "center",
          color: "#8c8c8c",
        }}
      >
        <Text type="secondary">Không có phòng chat nào.</Text>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <List
        itemLayout="horizontal"
        dataSource={rooms}
        style={{ padding: 0 }}
        renderItem={(room) => (
          <ChatRoomItem
            key={room.roomId}
            room={room}
            selected={selectedRoomId === room.roomId}
            unreadCount={unreadCounts[room.roomId] || 0}
            onSelect={onRoomSelect || (() => {})}
          />
        )}
      />
    </div>
  );
}

export default React.memo(ChatList);
