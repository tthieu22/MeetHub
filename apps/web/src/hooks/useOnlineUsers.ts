import { useEffect, useState } from "react";
import { getSocket } from "@web/lib/socket";

export function useOnlineUsers() {
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    const socket = getSocket();
    const handleOnlineUsers = (ids: string[]) => setOnlineUserIds(ids);
    socket.on("users:online", handleOnlineUsers);
    return () => {
      socket.off("users:online", handleOnlineUsers);
    };
  }, []);

  return onlineUserIds;
}
