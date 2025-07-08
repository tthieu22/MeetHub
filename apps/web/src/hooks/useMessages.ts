"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageService, Message } from "@web/lib/api";

export function useMessages(roomId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const fetchMessages = useCallback(
    async (pageNum = 1, append = false) => {
      if (!roomId) return;

      try {
        setLoading(true);
        setError(null);
        const response = await MessageService.getMessages(roomId, pageNum, 50);

        if (append) {
          setMessages((prev) => [...response.data, ...prev]);
        } else {
          setMessages(response.data);
        }

        setHasMore(response.hasNext);
        setPage(pageNum);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
      } finally {
        setLoading(false);
      }
    },
    [roomId]
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId) return;

      try {
        const newMessage = await MessageService.sendMessage(
          { text: content }, // body chỉ có text
          roomId // conversationId truyền vào query string
        );

        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không thể gửi tin nhắn");
        throw err;
      }
    },
    [roomId]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await MessageService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isDeleted: true } : msg
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa tin nhắn");
    }
  }, []);

  const togglePinMessage = useCallback(async (messageId: string) => {
    try {
      const updatedMessage = await MessageService.togglePinMessage(messageId);
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? updatedMessage : msg))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể ghim tin nhắn");
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      // Note: addReaction method might not exist in MessageService
      // This is a placeholder for future implementation
      console.log("Adding reaction:", emoji, "to message:", messageId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể thêm reaction");
    }
  }, []);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      await MessageService.markAsRead(messageId);
    } catch (err) {
      console.error("Không thể đánh dấu đã đọc:", err);
    }
  }, []);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loading) {
      fetchMessages(page + 1, true);
    }
  }, [hasMore, loading, page, fetchMessages]);

  useEffect(() => {
    if (roomId) {
      console.log("Room changed, fetching messages for:", roomId);
      setMessages([]);
      setPage(1);
      setHasMore(true);
      fetchMessages(1, false);
    }
  }, [roomId]); // Remove fetchMessages from dependency to avoid unnecessary re-fetches

  return {
    messages,
    loading,
    error,
    hasMore,
    sendMessage,
    deleteMessage,
    togglePinMessage,
    addReaction,
    markAsRead,
    loadMoreMessages,
    fetchMessages,
  };
}
