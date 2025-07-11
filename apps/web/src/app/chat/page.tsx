"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocket } from "@web/hooks/useWebSocket";
import ChatList from "@web/components/chat/ChatList";
import ChatMessages from "@web/components/chat/ChatMessages";
import ChatInput from "@web/components/chat/ChatInput";
import ChatHeader from "@web/components/chat/ChatHeader";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  console.log("Render: ChatPage");
  // Tối ưu selector: chỉ lấy đúng trường cần thiết
  const rooms = useChatStore((state) => state.rooms);
  const messages = useChatStore((state) => state.messages);
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");

  // Memo hóa currentMessages và selectedRoom
  const currentMessages = useMemo(
    () => (roomId ? (messages[roomId] ?? []) : []),
    [roomId, messages]
  );
  const selectedRoom = useMemo(
    () => (roomId ? rooms.find((room) => room.roomId === roomId) : undefined),
    [roomId, rooms]
  );

  const {
    getMessages,
    sendMessage,
    joinRoom,
    getRooms,
    getUnreadCount,
    markRoomRead,
    isConnected,
  } = useWebSocket();

  // State quản lý loading, hasMore
  const [loadingMessages, setLoadingMessages] = useState(false);
  const hasMoreMessages = true;

  // Auto load rooms khi component mount
  useEffect(() => {
    if (isConnected && rooms.length === 0) {
      getRooms();
    }
  }, [isConnected, rooms.length, getRooms]);

  useEffect(() => {
    if (roomId) {
      getMessages(roomId);
      joinRoom(roomId);
    }
  }, [roomId, getMessages, joinRoom]);

  // Load unread counts for all rooms when rooms are loaded
  useEffect(() => {
    if (isConnected && rooms.length > 0) {
      rooms.forEach((room) => {
        getUnreadCount(room.roomId);
      });
    }
  }, [isConnected, rooms, getUnreadCount]);

  // Hàm load thêm tin nhắn cũ (memo hóa)
  const handleLoadMore = useCallback(() => {
    if (roomId && currentMessages.length > 0) {
      setLoadingMessages(true);
      const firstMsgId = currentMessages[0]._id;
      getMessages(roomId, firstMsgId);
      setLoadingMessages(false);
    }
  }, [roomId, currentMessages, getMessages]);

  // Memo hóa function chọn room
  const handleRoomSelect = useCallback(
    (selectedRoomId: string) => {
      const url = new URL(window.location.href);
      url.searchParams.set("roomId", selectedRoomId);
      window.history.pushState({}, "", url.toString());
      // Mark the selected room as read immediately
      console.log(`[ChatPage] Marking selected room ${selectedRoomId} as read`);
      markRoomRead(selectedRoomId);
    },
    [markRoomRead]
  );

  // Memo hóa function gửi tin nhắn
  const handleSendMessage = useCallback(
    (messageText: string) => {
      if (roomId) {
        sendMessage(roomId, messageText);
      }
    },
    [roomId, sendMessage]
  );

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Sidebar bên trái - Danh sách room */}
      <div
        style={{
          width: 300,
          backgroundColor: "white",
          borderRight: "1px solid #e8e8e8",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e8e8e8",
            backgroundColor: "#fafafa",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            Tin nhắn
          </h2>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <ChatList
            rooms={rooms}
            selectedRoomId={roomId || undefined}
            onRoomSelect={handleRoomSelect}
            unreadCounts={unreadCounts}
          />
        </div>
      </div>

      {/* Nội dung bên phải - Tin nhắn */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "white",
        }}
      >
        <ChatHeader room={selectedRoom} />
        {roomId ? (
          <>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <ChatMessages
                messages={currentMessages}
                onlineMemberIds={selectedRoom?.onlineMemberIds}
                loading={loadingMessages}
                hasMore={hasMoreMessages}
                onLoadMore={handleLoadMore}
              />
            </div>
            <ChatInput disabled={!roomId} onSendMessage={handleSendMessage} />
          </>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "#999",
              fontSize: "16px",
            }}
          >
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
}
