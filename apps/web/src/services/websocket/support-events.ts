import { Socket } from "socket.io-client";
import { useWebSocketStore } from "@web/store/websocket.store";

// Định nghĩa kiểu dữ liệu cho các event Chat with admin
export interface SupportRoomEvent {
  roomId: string;
  admin?: {
    name?: string;
    _id?: string;
  };
}

// ================== SUPPORT/ADMIN EVENT HANDLERS ==================

/** Thông báo khi phòng đang pending (chưa có admin) */
export function handleSupportRoomPending(onSupportRoomPending?: () => void) {
  if (onSupportRoomPending) onSupportRoomPending();
}

/** Khi đã được gán admin */
export function handleSupportRoomAssigned(
  data: SupportRoomEvent,
  onSupportRoomAssigned?: (data: SupportRoomEvent) => void
) {
  if (onSupportRoomAssigned) onSupportRoomAssigned(data);
}

/** Khi admin join vào phòng pending */
export function handleSupportAdminJoined(
  data: SupportRoomEvent,
  onSupportAdminJoined?: (data: SupportRoomEvent) => void
) {
  if (onSupportAdminJoined) onSupportAdminJoined(data);
  // Có thể reload lại danh sách phòng/messages nếu cần
  try {
    const { socket } = useWebSocketStore.getState();
    if (socket && socket.connected) {
      socket.emit("get_rooms");
      if (data && data.roomId) {
        socket.emit("get_messages", { roomId: data.roomId });
      }
    }
  } catch (err) {
    console.error(
      "[FE] handleSupportAdminJoined: reload rooms/messages error",
      err
    );
  }
}

/** Khi admin nhận được ticket hỗ trợ */
export function handleSupportTicketAssigned(
  data: { roomId: string; userId: string },
  onSupportTicketAssigned?: (data: { roomId: string; userId: string }) => void
) {
  if (onSupportTicketAssigned) onSupportTicketAssigned(data);
}

/** Khi admin bị đổi do timeout */
export function handleSupportAdminChanged(
  data: { roomId: string; userId: string; newAdminId: string },
  onSupportAdminChanged?: (data: {
    roomId: string;
    userId: string;
    newAdminId: string;
  }) => void
) {
  if (onSupportAdminChanged) onSupportAdminChanged(data);
  // Có thể thêm logic thông báo cho user hoặc reload lại phòng nếu cần
}

// ================== SUPPORT/ADMIN EVENT SOCKET BINDINGS ==================

export function bindSupportAdminEventHandlers(
  socket: Socket,
  handlers: {
    onSupportRoomPending?: () => void;
    onSupportRoomAssigned?: (data: SupportRoomEvent) => void;
    onSupportAdminJoined?: (data: SupportRoomEvent) => void;
    onSupportTicketAssigned?: (data: {
      roomId: string;
      userId: string;
    }) => void;
    onSupportAdminChanged?: (data: {
      roomId: string;
      userId: string;
      newAdminId: string;
    }) => void;
  }
) {
  socket.on("support_room_pending", () => {
    handleSupportRoomPending(handlers?.onSupportRoomPending);
  });
  socket.on("support_room_assigned", (data: SupportRoomEvent) => {
    handleSupportRoomAssigned(data, handlers?.onSupportRoomAssigned);
  });
  socket.on("support_admin_joined", (data: SupportRoomEvent) => {
    handleSupportAdminJoined(data, handlers?.onSupportAdminJoined);
  });
  socket.on(
    "support_ticket_assigned",
    (data: { roomId: string; userId: string }) => {
      handleSupportTicketAssigned(data, handlers?.onSupportTicketAssigned);
    }
  );
  socket.on(
    "support_admin_changed",
    (data: { roomId: string; userId: string; newAdminId: string }) => {
      handleSupportAdminChanged(data, handlers?.onSupportAdminChanged);
    }
  );
}
