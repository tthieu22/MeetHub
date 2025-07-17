import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import { WebSocketEventHandlers } from "./websocket.types";

export function bindErrorEventHandlers(
  socket: Socket,
  handlers: WebSocketEventHandlers
) {
  socket.on(WS_RESPONSE_EVENTS.ERROR, (data: WsResponse) => {
    handlers.onError?.(data);
  });
  socket.on(WS_RESPONSE_EVENTS.AUTH_ERROR, (data: WsResponse) => {
    handlers.onAuthError?.(data);
  });
}
