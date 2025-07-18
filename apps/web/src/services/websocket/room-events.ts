import { Socket } from "socket.io-client";
import { WsResponse } from "@web/types/websocket";
import { ChatRoom } from "@web/types/chat";
import { WS_RESPONSE_EVENTS } from "@web/constants/websocket.events";
import { WebSocketEventHandlers } from "./websocket.types";
import { handleRoomMarkedRead } from "./core-handlers";

export function bindRoomEventHandlers(
  socket: Socket,
  handlers: WebSocketEventHandlers
) {
  socket.on(WS_RESPONSE_EVENTS.ROOMS, (data: WsResponse<ChatRoom[]>) => {
    handlers.onRooms?.(data);
  });
  socket.on(
    "room_online_members",
    (data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>) => {
      handlers.onRoomOnlineMembers?.(data);
    }
  );
  socket.on("room_marked_read", (data: WsResponse<{ roomId: string }>) => {
    handlers.onRoomMarkedRead?.(data);
  });
  socket.on(
    WS_RESPONSE_EVENTS.ROOM_MARKED_READ,
    (data: WsResponse<{ roomId: string }>) => {
      handleRoomMarkedRead(data);
      handlers.onRoomMarkedRead?.(data);
    }
  );
}
