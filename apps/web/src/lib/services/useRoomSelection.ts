import { useCallback } from "react";

export function useRoomSelection() {
  const handleRoomSelect = useCallback(
    (roomId: string, onSelect?: (roomId: string) => void) => {
      if (onSelect) {
        onSelect(roomId);
      }
    },
    []
  );

  return { handleRoomSelect };
}
