import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { Message } from "@web/types/chat";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import { WebSocketEventHandlers } from "./websocket.types";
import { useChatStore } from "@web/store/chat.store";

export function bindMessageEventHandlers(
  socket: Socket,
  handlers: WebSocketEventHandlers
) {
  socket.on(
    WS_RESPONSE_EVENTS.MESSAGES,
    (
      data: WsResponse<{
        roomId: string;
        data: Message[];
        hasMore: boolean;
        before?: string;
      }>
    ) => {
      if (data.success && data.data) {
        useChatStore.getState().setMessages(data.data.roomId, data.data.data);
      }
      handlers.onMessages?.(data);
    }
  );
  socket.on(WS_RESPONSE_EVENTS.NEW_MESSAGE, (data: WsResponse<Message>) => {
    if (data.success && data.data && data.data.conversationId) {
      useChatStore.getState().addMessage(data.data.conversationId, data.data);
    }
    handlers.onNewMessage?.(data);
  });
  socket.on(
    WS_RESPONSE_EVENTS.UNREAD_COUNT_UPDATED,
    (data: WsResponse<{ roomId: string; unreadCount: number }>) => {
      handlers.onUnreadCountUpdated?.(data);
    }
  );
  socket.on(
    WS_RESPONSE_EVENTS.UNREAD_COUNT,
    (data: WsResponse<{ roomId: string; unreadCount: number }>) => {
      handlers.onUnreadCountUpdated?.(data);
    }
  );
}
