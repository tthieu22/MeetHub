import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@web/lib/socket";

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export const useOnlineStatus = () => {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const socket = getSocket();

    const handleOnlineUsers = (userIds: string[]) => {
      console.log("🟢 Received online users via WebSocket:", userIds);
      setOnlineUsers(userIds);
      setLoading(false);
    };

    const handleConnect = () => {
      console.log("🔗 WebSocket connected");
      setIsConnected(true);
      setLoading(true);
    };

    const handleDisconnect = () => {
      console.log("🔌 WebSocket disconnected");
      setIsConnected(false);
      setLoading(false);
    };

    // Lắng nghe WebSocket events
    socket.on("users:online", handleOnlineUsers);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Nếu socket đã connect, set loading = false
    if (socket.connected) {
      setIsConnected(true);
      setLoading(false);
    }

    return () => {
      socket.off("users:online", handleOnlineUsers);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Kiểm tra user có online không
  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.includes(userId);
    },
    [onlineUsers]
  );

  // Lấy số lượng user online
  const getOnlineCount = useCallback(() => {
    return onlineUsers.length;
  }, [onlineUsers]);

  return {
    onlineUsers,
    isConnected,
    loading,
    isUserOnline,
    getOnlineCount,
  };
};
