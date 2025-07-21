"use client";

import { useWebSocket } from "@web/hooks/useWebSocket";
import { useChatStore } from "@web/store/chat.store";
import { notification } from "antd";
import { useEffect, useRef } from "react";

export function WebSocketProvider() {
  // Always call the hook, let it handle authentication internally
  useWebSocket();

  const rooms = useChatStore((s) => s.rooms);
  const prevRoomsRef = useRef(rooms);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const isInitialLoad = prevRoomsRef.current.length === 0 && rooms.length > 0;

    // Chỉ so sánh khi rooms thực sự thay đổi và không phải lần tải đầu tiên
    if (!isInitialLoad && prevRoomsRef.current !== rooms) {
      const oldRoomIds = new Set(prevRoomsRef.current.map((r) => r.roomId));
      const newRoom = rooms.find((room) => !oldRoomIds.has(room.roomId));

      if (newRoom) {
        api.success({
          message: "Bạn có cuộc trò chuyện mới",
          description: `Bạn vừa được thêm vào cuộc trò chuyện: ${newRoom.name}`,
          placement: "topRight",
        });
      }
    }
    // Cập nhật ref cho lần render tiếp theo
    prevRoomsRef.current = rooms;
  }, [rooms, api]);

  return <>{contextHolder}</>;
}
