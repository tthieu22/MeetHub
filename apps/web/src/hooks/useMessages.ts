"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageService } from "@web/lib/api";
import { chatService } from "@web/lib/services/chatService";
import { useChat } from "@web/lib/store/useChat";
import { StoreMessage } from "@web/types/chat";

export function useMessages(roomId: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoinedRoom, setIsJoinedRoom] = useState(false);
  const { messages, addMessage, clearMessages, setMessages } = useChat();

  useEffect(() => {
    if (!roomId) return;
    clearMessages();
    chatService.joinRoomSocket(roomId);
    const handleJoinedRoom = (data: { roomId: string }) => {
      if (data.roomId === roomId) {
        setIsJoinedRoom(true);
        setLoading(false);
      }
    };
    chatService.onJoinedRoom(handleJoinedRoom);

    function getRoomIdFromMessage(msg: StoreMessage): string {
      if ("roomId" in msg && typeof msg.roomId === "string") return msg.roomId;
      if ("conversationId" in msg && typeof msg.conversationId === "string")
        return msg.conversationId;
      return "";
    }
    const handleNewMessage = (msg: StoreMessage) => {
      const msgRoomId = getRoomIdFromMessage(msg);
      if (msgRoomId === roomId) {
        // Chỉ thêm nếu chưa có id này trong store
        if (!messages.some((m) => m.id === msg.id)) {
          addMessage(msg);
        }
      }
    };
    const socketHandler = (msg: unknown) =>
      handleNewMessage(msg as StoreMessage);
    chatService.onNewMessage(socketHandler);

    // Lắng nghe lịch sử tin nhắn khi join room
    const handleHistory = (data: {
      roomId: string;
      messages: StoreMessage[];
    }) => {
      console.log("[SOCKET] Nhận lịch sử tin nhắn:", data);
      if (data.roomId === roomId) {
        setMessages(data.messages);
      }
    };
    chatService.socket.on("chat:messages:history", handleHistory);

    return () => {
      chatService.leaveRoomSocket(roomId);
      chatService.offNewMessage(socketHandler);
      chatService.socket.off("chat:messages:history", handleHistory);
      // clearMessages();
    };
  }, [roomId, addMessage, setMessages, clearMessages]);

  return {
    messages: [...messages].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    ),
    loading,
    error,
    sendMessage: async (content: string) => {
      if (!roomId) return;
      if (!isJoinedRoom) {
        await new Promise<void>((resolve) => {
          const check = (data: { roomId: string }) => {
            if (data.roomId === roomId) {
              setIsJoinedRoom(true);
              chatService.socket.off("joinedRoom", check);
              resolve();
            }
          };
          chatService.socket.on("joinedRoom", check);
        });
      }
      try {
        // Gửi qua socket, không tự thêm vào state
        await chatService.socket.emit("chat:message:new", {
          text: content,
          roomId,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn");
        throw err;
      }
    },
    deleteMessage: useCallback(async (messageId: string) => {
      try {
        await MessageService.deleteMessage(messageId);
        // setMessages((prev) =>
        //   prev.map((msg) =>
        //     msg.id === messageId ? { ...msg, isDeleted: true } : msg
        //   )
        // );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể xóa tin nhắn");
      }
    }, []),
    togglePinMessage: useCallback(async () => {}, []),
    addReaction: useCallback(async () => {}, []),
    markAsRead: useCallback(async (messageId: string) => {
      try {
        await MessageService.markAsRead(messageId);
      } catch (err) {
        console.error("Không thể đánh dấu đã đọc:", err);
      }
    }, []),
    loadMoreMessages: useCallback(() => {
      // This function is no longer needed as messages are fetched via socket
    }, []),
    fetchMessages: useCallback(() => {
      // This function is no longer needed as messages are fetched via socket
    }, []),
  };
}
