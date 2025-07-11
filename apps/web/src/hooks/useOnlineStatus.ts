"use client";

import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@web/store/user.store";
import { useChatStore } from "@web/store/chat.store";

export const useOnlineStatus = (roomId?: string) => {
  const [localOnlineUsers, setLocalOnlineUsers] = useState<string[]>([]);
  const currentUser = useUserStore((state) => state.currentUser);
  const selectedRoom = useChatStore((state) =>
    roomId ? state.rooms.find((room) => room.roomId === roomId) : undefined
  );
  const prevOnlineIdsRef = useRef<string[]>([]);
  useEffect(() => {
    if (roomId && selectedRoom) {
      const onlineIds = selectedRoom.onlineMemberIds || [];
      const onlineIdsStr = onlineIds.join(",");
      const prev = prevOnlineIdsRef.current.join(",");
      if (prev !== onlineIdsStr) {
        setLocalOnlineUsers(onlineIds);
        prevOnlineIdsRef.current = onlineIds;
        console.log(
          "🔵 [useOnlineStatus] Updated localOnlineUsers:",
          onlineIds
        );
      }
    }
    // eslint-disable-next-line
  }, [roomId, selectedRoom ? selectedRoom.onlineMemberIds?.join(",") : ""]);

  // Khi user leave room, xóa khỏi online list
  useEffect(() => {
    return () => {
      if (roomId && currentUser) {
        const { updateRoomOnlineStatus } = useChatStore.getState();
        updateRoomOnlineStatus(roomId, currentUser._id, false);
      }
    };
  }, [roomId, currentUser]);

  return {
    onlineUsers: localOnlineUsers,
    isOnline: (userId: string) => localOnlineUsers.includes(userId),
    addOnlineUser: (userId: string) => {
      if (!localOnlineUsers.includes(userId)) {
        setLocalOnlineUsers((prev) => [...prev, userId]);
        if (roomId) {
          const { updateRoomOnlineStatus } = useChatStore.getState();
          updateRoomOnlineStatus(roomId, userId, true);
        }
      }
    },
    removeOnlineUser: (userId: string) => {
      setLocalOnlineUsers((prev) => prev.filter((id) => id !== userId));
      if (roomId) {
        const { updateRoomOnlineStatus } = useChatStore.getState();
        updateRoomOnlineStatus(roomId, userId, false);
      }
    },
  };
};
