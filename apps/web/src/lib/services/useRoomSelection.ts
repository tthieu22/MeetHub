import { useCallback } from "react";
import { createSocket } from "./socket.service";

export function useRoomSelection() {
  const handleRoomSelect = useCallback(
    (roomId: string, onSelect?: (roomId: string) => void) => {
      const socket = createSocket();

      socket.emit("mark_room_read", { roomId });

      if (onSelect) {
        onSelect(roomId);
      }
    },
    []
  );

  return { handleRoomSelect };
}
