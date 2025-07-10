// Socket service
export { getSocket } from "@web/lib/services/socket.service";

// Chat hooks
export {
  useChatRooms,
  type ChatRoom,
  type WsResponse,
} from "@web/lib/services/useChatRooms";

export {
  useChatMessages,
  type Message,
  type MessagesResponse,
} from "@web/lib/services/useChatMessages";
export { useUnreadCount } from "@web/lib/services/useUnreadCount";
export { useRoomSelection } from "@web/lib/services/useRoomSelection";
