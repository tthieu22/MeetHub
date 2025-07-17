import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { UsersOnline } from "@web/types/chat";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import { WebSocketEventHandlers } from "./websocket.types";

export function bindUserEventHandlers(
  socket: Socket,
  handlers: WebSocketEventHandlers
) {
  socket.on(
    WS_RESPONSE_EVENTS.USER_ONLINE,
    (data: WsResponse<{ userId: string; roomId: string }>) => {
      handlers.onUserOnline?.(data);
    }
  );
  socket.on(
    WS_RESPONSE_EVENTS.USER_OFFLINE,
    (data: WsResponse<{ userId: string; roomId: string }>) => {
      handlers.onUserOffline?.(data);
    }
  );
  socket.on("all_online_users", (data: WsResponse<UsersOnline[]>) => {
    handlers.onAllOnlineUsers?.(data);
  });
}
