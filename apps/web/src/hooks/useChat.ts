import { useEffect, useCallback } from "react";
import { useChatStore } from "@web/store/chat.store";
import { useWebSocket } from "./useWebSocket";

export const useChat = () => {
  const {
    rooms,
    messages,
    unreadCounts,
    currentRoomId,
    onlineUsers,
    setCurrentRoom,
    // setMessages,
    // addMessage,
    // updateUnreadCount,
  } = useChatStore();

  const {
    isConnected,
    sendMessage: wsSendMessage,
    getRooms: wsGetRooms,
    getMessages: wsGetMessages,
    markRoomRead: wsMarkRoomRead,
    getUnreadCount: wsGetUnreadCount,
    joinRoom: wsJoinRoom,
  } = useWebSocket();

  // Get current room messages
  const currentRoomMessages = currentRoomId
    ? messages[currentRoomId] || []
    : [];

  // Get current room unread count
  const currentRoomUnreadCount = currentRoomId
    ? unreadCounts[currentRoomId] || 0
    : 0;

  // Get current room info
  const currentRoom = currentRoomId
    ? rooms.find((room) => room.roomId === currentRoomId)
    : null;

  // Send message
  const sendMessage = useCallback(
    (text: string) => {
      if (currentRoomId && isConnected) {
        wsSendMessage(currentRoomId, text);
      } else {
        console.warn(
          "Cannot send message: no current room or WebSocket not connected"
        );
      }
    },
    [currentRoomId, isConnected, wsSendMessage]
  );

  // Load rooms
  const loadRooms = useCallback(() => {
    if (isConnected) {
      wsGetRooms();
    }
  }, [isConnected, wsGetRooms]);

  // Load messages for a room
  const loadMessages = useCallback(
    (roomId: string, before?: string) => {
      if (isConnected) {
        wsGetMessages(roomId, before);
      }
    },
    [isConnected, wsGetMessages]
  );

  // Load current room messages
  const loadCurrentRoomMessages = useCallback(
    (before?: string) => {
      if (currentRoomId) {
        loadMessages(currentRoomId, before);
      }
    },
    [currentRoomId, loadMessages]
  );

  // Mark current room as read
  const markCurrentRoomAsRead = useCallback(() => {
    if (currentRoomId && isConnected) {
      console.log(`[useChat] Marking current room ${currentRoomId} as read`);
      wsMarkRoomRead(currentRoomId);
    }
  }, [currentRoomId, isConnected, wsMarkRoomRead]);

  // Get unread count for a room
  const loadUnreadCount = useCallback(
    (roomId: string) => {
      if (isConnected) {
        wsGetUnreadCount(roomId);
      }
    },
    [isConnected, wsGetUnreadCount]
  );

  // Join a room
  const joinRoom = useCallback(
    (roomId: string) => {
      if (isConnected) {
        wsJoinRoom(roomId);
        setCurrentRoom(roomId);

        // Load messages for the room
        loadMessages(roomId);

        // Load unread count for the room
        loadUnreadCount(roomId);
      }
    },
    [isConnected, wsJoinRoom, setCurrentRoom, loadMessages, loadUnreadCount]
  );

  // Leave current room
  const leaveCurrentRoom = useCallback(() => {
    setCurrentRoom(null);
  }, [setCurrentRoom]);

  // Check if user is online
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers[userId] || false;
    },
    [onlineUsers]
  );

  // Get total unread count across all rooms
  const totalUnreadCount = Object.values(unreadCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  // Auto load rooms when connected
  useEffect(() => {
    if (isConnected && rooms.length === 0) {
      loadRooms();
    }
  }, [isConnected, rooms.length, loadRooms]);

  // Auto mark room as read when entering and load unread counts
  useEffect(() => {
    if (currentRoomId) {
      // Load unread count for current room
      loadUnreadCount(currentRoomId);
    }
  }, [currentRoomId, loadUnreadCount]);

  // Mark room as read when entering a room
  useEffect(() => {
    if (currentRoomId) {
      console.log(
        `[useChat] Marking room ${currentRoomId} as read when entering`
      );
      markCurrentRoomAsRead();
    }
  }, [currentRoomId, markCurrentRoomAsRead]);

  return {
    // State
    rooms,
    messages,
    unreadCounts,
    currentRoomId,
    currentRoom,
    currentRoomMessages,
    currentRoomUnreadCount,
    onlineUsers,
    totalUnreadCount,
    isConnected,

    // Actions
    sendMessage,
    loadRooms,
    loadMessages,
    loadCurrentRoomMessages,
    markCurrentRoomAsRead,
    loadUnreadCount,
    joinRoom,
    leaveCurrentRoom,
    isUserOnline,
  };
};
