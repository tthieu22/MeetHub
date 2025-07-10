// Socket service
export { getSocket } from "@web/lib/services/socket.service";

// Chat types
export type {
  WsResponse,
  Message,
  MessagesResponse,
  RoomMemberInfo,
  LastMessageInfo,
  ChatRoom,
} from "@web/types/chat";

// Chat hooks
export { useChatRooms } from "@web/lib/services/useChatRooms";
export { useChatMessages } from "@web/lib/services/useChatMessages";
export { useUnreadCount } from "@web/lib/services/useUnreadCount";
export { useRoomSelection } from "@web/lib/services/useRoomSelection";
