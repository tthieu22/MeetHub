"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import ChatList from "@web/components/chat/ChatList";
import ChatMessages from "@web/components/chat/ChatMessages";
import ChatInput from "@web/components/chat/ChatInput";
import ChatHeader from "@web/components/chat/ChatHeader";
import OnlineUsersList from "@web/components/OnlineUsersList";
import { useSearchParams } from "next/navigation";
import { WS_EVENTS, WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import type { Message } from "@web/types/chat";
import { Button, notification } from "antd";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const router = useRouter();
  const rooms = useChatStore((state) => state.rooms);
  const messages = useChatStore((state) => state.messages);
  const unreadCounts = useChatStore((state) => state.unreadCounts);

  // State quản lý tin nhắn đang reply
  const [replyMessage, setReplyMessage] = useState<{
    id: string;
    text: string;
    sender?: { id: string; name: string; avatar?: string; email?: string };
    fileName?: string;
  } | null>(null);
  const [chatClosed, setChatClosed] = useState(false);
  const [api, contextHolder] = notification.useNotification();

  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");

  const currentMessages = useMemo(
    () => (roomId ? (messages[roomId] ?? []) : []),
    [roomId, messages]
  );

  // Tối ưu hóa selectedRoom - chỉ tạo lại khi roomId thay đổi hoặc room cụ thể thay đổi
  const currentRoom = rooms.find((r) => r.roomId === roomId);
  const selectedRoom = useMemo(() => {
    if (!roomId) return undefined;

    const room = currentRoom;
    if (!room) return undefined;

    // Trả về object mới chỉ khi room thực sự thay đổi
    return {
      roomId: room.roomId,
      name: room.name,
      members: room.members,
      onlineMemberIds: room.onlineMemberIds,
    };
  }, [roomId, currentRoom]);

  // Lấy state và socket từ store
  const { isConnected, socket } = useWebSocketStore();

  // WebSocket functions using socket from store
  const getRooms = useCallback(() => {
    if (isConnected && socket) {
      socket.emit(WS_EVENTS.GET_ROOMS);
    }
  }, [isConnected, socket]);

  const getMessages = useCallback(
    (roomId: string, before?: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.GET_MESSAGES, { roomId, before });
      }
    },
    [isConnected, socket]
  );

  const joinRoom = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.JOIN_ROOM, { roomId });
        socket.emit("get_room_online_members", { roomId });
        socket.emit(WS_EVENTS.GET_UNREAD_COUNT, { roomId });
      }
    },
    [isConnected, socket]
  );

  const getUnreadCount = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.GET_UNREAD_COUNT, { roomId });
      }
    },
    [isConnected, socket]
  );

  const markRoomRead = useCallback(
    (roomId: string) => {
      if (isConnected && socket) {
        socket.emit(WS_EVENTS.MARK_ROOM_READ, { roomId });
      }
    },
    [isConnected, socket]
  );

  const sendMessage = useCallback(
    async (roomId: string, text: string, file?: File) => {
      if (isConnected && socket) {
        if (file) {
          // Đọc file thành base64
          const fileData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          if (replyMessage) {
            socket.emit(WS_EVENTS.CREATE_MESSAGE, {
              roomId,
              text,
              fileData,
              fileName: file.name,
              fileType: file.type,
              replyTo: replyMessage.id,
            });
          } else {
            socket.emit(WS_EVENTS.CREATE_MESSAGE, {
              roomId,
              text,
              fileData,
              fileName: file.name,
              fileType: file.type,
            });
          }
        } else {
          if (replyMessage) {
            socket.emit(WS_EVENTS.CREATE_MESSAGE, {
              roomId,
              text,
              replyTo: replyMessage.id,
            });
          } else {
            socket.emit(WS_EVENTS.CREATE_MESSAGE, { roomId, text });
          }
        }
      }
    },
    [isConnected, socket, replyMessage]
  );

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

  // Lắng nghe sự kiện phòng bị đóng
  useEffect(() => {
    if (!socket || !roomId) return;
    const handleRoomClosed = () => {
      setChatClosed(true);
      api.info({
        message: "Phòng chat đã bị đóng",
        description:
          "Phòng chat này đã được đóng và toàn bộ tin nhắn đã được xoá.",
        duration: 3,
        onClose: () => router.push("/"),
      });
      // Nếu user không bấm tắt notification thì sau 3s cũng chuyển hướng
      setTimeout(() => router.push("/"), 3000);
    };
    socket.on(WS_RESPONSE_EVENTS.SUPPORT_ROOM_CLOSED, handleRoomClosed);
    return () => {
      socket.off(WS_RESPONSE_EVENTS.SUPPORT_ROOM_CLOSED, handleRoomClosed);
    };
  }, [socket, roomId, api, router]);

  // Lắng nghe sự kiện admin bị chuyển
  useEffect(() => {
    if (!socket || !roomId) return;
    const handleAdminChanged = () => {
      api.info({
        message: "Admin hỗ trợ đã được chuyển",
        description:
          "Bạn đã được chuyển sang admin hỗ trợ mới. Vui lòng chờ phản hồi!",
        duration: 5,
      });
      // Reload lại room info nếu cần
      getRooms();
    };
    socket.on(WS_RESPONSE_EVENTS.SUPPORT_ADMIN_CHANGED, handleAdminChanged);
    return () => {
      socket.off(WS_RESPONSE_EVENTS.SUPPORT_ADMIN_CHANGED, handleAdminChanged);
    };
  }, [socket, roomId, api, getRooms]);

  // Chủ động reload rooms khi join phòng thành công (admin hoặc user)
  useEffect(() => {
    if (!socket) return;
    const handleRoomJoined = () => {
      getRooms();
    };
    socket.on(WS_RESPONSE_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on("support_admin_joined", handleRoomJoined);
    return () => {
      socket.off(WS_RESPONSE_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off("support_admin_joined", handleRoomJoined);
    };
  }, [socket, getRooms]);

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
      markRoomRead(selectedRoomId);
    },
    [markRoomRead]
  );

  // Memo hóa function gửi tin nhắn
  const handleSendMessage = useCallback(
    async (messageText: string, file?: File) => {
      if (roomId) {
        await sendMessage(roomId, messageText, file);
        setReplyMessage(null);
      }
    },
    [roomId, sendMessage]
  );

  // Hàm đóng phòng
  const handleCloseRoom = useCallback(() => {
    if (socket && roomId) {
      socket.emit(WS_EVENTS.CLOSE_SUPPORT_ROOM, { roomId });
    }
  }, [socket, roomId]);

  // Hàm chọn tin nhắn để reply
  const handleReplyMessage = useCallback((id: string, message: Message) => {
    setReplyMessage({
      id: message._id,
      text: message.text,
      sender:
        typeof message.senderId === "object" && message.senderId !== null
          ? {
              id: message.senderId._id,
              name:
                message.senderId.username ||
                message.senderId.email ||
                "Unknown",
              avatar: message.senderId.avatar,
              email: message.senderId.email,
            }
          : { id: String(message.senderId), name: "Unknown" },
      fileName: message.fileName,
    });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "90vh",
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

      {/* Sidebar bên phải - Danh sách người online */}
      <div
        style={{
          width: 250,
          backgroundColor: "white",
          borderLeft: "1px solid #e8e8e8",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <OnlineUsersList />
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
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {contextHolder}
          {/* Header phòng chat */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 16px",
              borderBottom: "1px solid #e8e8e8",
              background: "#fff",
            }}
          >
            <ChatHeader room={selectedRoom} />
            {/* Nút đóng phòng */}
            {roomId && !chatClosed && (
              <Button danger onClick={handleCloseRoom} size="small">
                Đóng phòng
              </Button>
            )}
          </div>
          {/* Nội dung chat */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {chatClosed ? (
              <div style={{ padding: 32, textAlign: "center", color: "#888" }}>
                Phòng chat đã bị đóng và toàn bộ tin nhắn đã bị xoá.
              </div>
            ) : (
              <ChatMessages
                messages={currentMessages}
                loading={loadingMessages}
                onLoadMore={handleLoadMore}
                hasMore={hasMoreMessages}
                onReply={handleReplyMessage}
              />
            )}
          </div>
          {/* Input chat */}
          {!chatClosed && (
            <ChatInput
              onSendMessage={handleSendMessage}
              replyMessage={replyMessage}
              onCancelReply={() => setReplyMessage(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
