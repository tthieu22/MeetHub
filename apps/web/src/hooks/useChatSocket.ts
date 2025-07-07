import { useEffect, useCallback } from "react";
import { getSocket } from "../lib/socket";
import { useChat, Message } from "../lib/store/useChat";

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
      socket.emit("room:joined", { roomId });
    },
    [socket]
  );

  // Leave room
  const leaveRoom = useCallback(
    (roomId: string) => {
      socket.emit("room:left", { roomId });
    },
    [socket]
  );

  // Send message
  const sendMessage = useCallback(
    (message: Message) => {
      socket.emit("message:new", message);
    },
    [socket]
  );

  // Delete message
  const removeMessage = useCallback(
    (messageId: string) => {
      socket.emit("message:deleted", { messageId });
    },
    [socket]
  );

  // Update reaction
  const updateMessageReaction = useCallback(
    (messageId: string, reaction: string) => {
      socket.emit("reaction:updated", { messageId, reaction });
    },
    [socket]
  );

  // Mark message as read
  const markAsRead = useCallback(
    (messageId: string) => {
      socket.emit("message:read", { messageId });
    },
    [socket]
  );

  useEffect(() => {
    // Listen for new messages
    socket.on("message:new", (data) => {
      addMessage(data);
    });

    // Listen for deleted messages
    socket.on("message:deleted", (data) => {
      deleteMessage(data.messageId);
    });

    // Listen for reaction updates
    socket.on("reaction:updated", (data) => {
      updateReaction(data.messageId, data.reaction);
    });

    // Listen for room updates
    socket.on("room:updated", (data) => {
      updateRoom(data);
    });

    // Listen for room join/leave
    socket.on("room:joined", (data) => {
      console.log("User joined room:", data);
    });

    socket.on("room:left", (data) => {
      console.log("User left room:", data);
    });

    // Listen for notifications
    socket.on("notification:new", (data) => {
      addNotification(data);
    });

    // Listen for message read status
    socket.on("message:read", (data) => {
      markMessageAsRead(data.messageId);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:deleted");
      socket.off("reaction:updated");
      socket.off("room:updated");
      socket.off("room:joined");
      socket.off("room:left");
      socket.off("notification:new");
      socket.off("message:read");
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
