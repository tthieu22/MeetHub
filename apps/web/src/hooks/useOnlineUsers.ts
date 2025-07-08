import { useState, useEffect, useCallback } from "react";
import { getSocket } from "@web/lib/socket";

export const useOnlineUsers = () => {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleOnlineUsers = (userIds: string[]) => {
      console.log("Received online users via WebSocket:", userIds);
      setOnlineUserIds(userIds);
      setLoading(false);
      setError(null);
    };

    const handleConnect = () => {
      console.log("Socket connected, waiting for online users...");
      setIsConnected(true);
      setLoading(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected");
      setIsConnected(false);
      setError("Connection lost");
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

  const updateOnlineUsers = useCallback((userIds: string[]) => {
    setOnlineUserIds(userIds);
  }, []);

  // Fallback function để fetch từ API nếu cần (chỉ dùng khi debug)
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      const { UserService } = await import("@web/lib/api/services/userService");
      const onlineUsers = await UserService.getOnlineUsers();
      setOnlineUserIds(onlineUsers);
      setError(null);
    } catch (error) {
      console.error("Error fetching online users:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch online users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    onlineUserIds,
    loading,
    error,
    isConnected,
    refetch,
    updateOnlineUsers,
  };
};
