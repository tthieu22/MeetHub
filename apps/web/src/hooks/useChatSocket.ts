import { useEffect, useCallback } from "react";
import { getSocket } from "@web/lib/socket";
import { useChat } from "@web/lib/store/useChat";
import { Message } from "@web/types/chat";

export const useChatSocket = () => {
  const {
    addMessage,
    deleteMessage,
    updateReaction,
    updateRoom,
    addNotification,
    markMessageAsRead,
  } = useChat();

  const socket = getSocket();

  // Join room
  const joinRoom = useCallback(
    (roomId: string) => {
      socket.emit("chat:room:joined", { roomId });
    },
    [socket]
  );

  // Leave room
  const leaveRoom = useCallback(
    (roomId: string) => {
      socket.emit("chat:room:left", { roomId });
    },
    [socket]
  );

  // Send message
  const sendMessage = useCallback(
    (message: Message) => {
      socket.emit("chat:message:new", message);
    },
    [socket]
  );

  // Delete message
  const removeMessage = useCallback(
    (messageId: string) => {
      socket.emit("chat:message:deleted", { messageId });
    },
    [socket]
  );

  // Update reaction
  const updateMessageReaction = useCallback(
    (messageId: string, reaction: string) => {
      socket.emit("chat:reaction:updated", { messageId, reaction });
    },
    [socket]
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      socket.emit("chat:message:read", { messageId });
    },
    [socket]
  );

  useEffect(() => {
    // Listen for new messages from other users
    socket.on("chat:message:new", (data) => {
      console.log("Received new message via WebSocket:", data);
      addMessage(data);
      console.log("Message added to store");
    });

    // Listen for saved message confirmation
    socket.on("chat:message:saved", (data) => {
      console.log("Message saved confirmation received:", data);
      // Có thể cập nhật tin nhắn tạm với ID thật từ database
    });

    // Listen for message errors
    socket.on("chat:message:error", (data) => {
      console.error("Message error received:", data);
      // Có thể hiển thị thông báo lỗi cho user
    });

    // Listen for deleted messages
    socket.on("chat:message:deleted", (data) => {
      deleteMessage(data.messageId);
    });

    // Listen for reaction updates
    socket.on("chat:reaction:updated", (data) => {
      updateReaction(data.messageId, data.reaction);
    });

    // Listen for room updates
    socket.on("chat:room:updated", (data) => {
      updateRoom(data);
    });

    // Listen for room join/leave
    socket.on("chat:room:joined", (data) => {
      console.log("User joined room:", data);
    });

    socket.on("chat:room:left", (data) => {
      console.log("User left room:", data);
    });

    // Listen for notifications
    socket.on("chat:notification:new", (data) => {
      addNotification(data);
    });

    // Listen for message read status
    socket.on("chat:message:read", (data) => {
      markMessageAsRead(data.messageId);
    });

    return () => {
      socket.off("chat:message:new");
      socket.off("chat:message:saved");
      socket.off("chat:message:error");
      socket.off("chat:message:deleted");
      socket.off("chat:reaction:updated");
      socket.off("chat:room:updated");
      socket.off("chat:room:joined");
      socket.off("chat:room:left");
      socket.off("chat:notification:new");
      socket.off("chat:message:read");
    };
  }, [
    socket,
    addMessage,
    deleteMessage,
    updateReaction,
    updateRoom,
    addNotification,
    markMessageAsRead,
  ]);

  return {
    socket,
    joinRoom,
    leaveRoom,
    sendMessage,
    removeMessage,
    updateMessageReaction,
    markAsRead,
  };
};
