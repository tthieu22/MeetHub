"use client";

import { useEffect, useRef, useState } from "react";
import { useUserStore } from "@web/store/user.store";
import { useChatStore } from "@web/store/chat.store";

// Hook này dùng để quản lý trạng thái online của các thành viên trong một phòng chat (theo roomId)
export const useOnlineStatus = (roomId?: string) => {
  // Danh sách userId đang online trong phòng (state cục bộ cho UI)
  const [localOnlineUsers, setLocalOnlineUsers] = useState<string[]>([]);
  // User hiện tại
  const currentUser = useUserStore((state) => state.currentUser);
  // Lấy thông tin phòng chat theo roomId
  const selectedRoom = useChatStore((state) =>
    roomId ? state.rooms.find((room) => room.roomId === roomId) : undefined
  );
  // Lưu lại danh sách online trước đó để so sánh, tránh cập nhật thừa
  const prevOnlineIdsRef = useRef<string[]>([]);

  // Effect: Theo dõi khi danh sách online của phòng thay đổi thì cập nhật lại localOnlineUsers
  useEffect(() => {
    if (roomId && selectedRoom) {
      const onlineIds = selectedRoom.onlineMemberIds || [];
      const onlineIdsStr = onlineIds.join(",");
      const prev = prevOnlineIdsRef.current.join(",");
      // Nếu danh sách online thay đổi thì cập nhật lại state
      if (prev !== onlineIdsStr) {
        setLocalOnlineUsers(onlineIds);
        prevOnlineIdsRef.current = onlineIds;
      }
    }
    // eslint-disable-next-line
  }, [roomId, selectedRoom ? selectedRoom.onlineMemberIds?.join(",") : ""]);

  // Effect: Khi user rời phòng (component unmount), tự động cập nhật trạng thái user hiện tại thành offline trong phòng
  useEffect(() => {
    return () => {
      if (roomId && currentUser) {
        const { updateRoomOnlineStatus } = useChatStore.getState();
        updateRoomOnlineStatus(roomId, currentUser._id, false);
      }
    };
  }, [roomId, currentUser]);

  return {
    // Danh sách userId đang online trong phòng
    onlineUsers: localOnlineUsers,

    // Kiểm tra một user có đang online không
    isOnline: (userId: string) => localOnlineUsers.includes(userId),

    // Thêm user vào danh sách online (và cập nhật store)
    addOnlineUser: (userId: string) => {
      if (!localOnlineUsers.includes(userId)) {
        setLocalOnlineUsers((prev) => [...prev, userId]);
        if (roomId) {
          const { updateRoomOnlineStatus } = useChatStore.getState();
          updateRoomOnlineStatus(roomId, userId, true);
        }
      }
    },

    // Xóa user khỏi danh sách online (và cập nhật store)
    removeOnlineUser: (userId: string) => {
      setLocalOnlineUsers((prev) => prev.filter((id) => id !== userId));
      if (roomId) {
        const { updateRoomOnlineStatus } = useChatStore.getState();
        updateRoomOnlineStatus(roomId, userId, false);
      }
    },
  };
};
