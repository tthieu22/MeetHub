import { Socket } from "socket.io-client";
import { Message, ChatRoom, UsersOnline } from "@web/types/chat";
import { WsResponse } from "@web/types/websocket";
import { WebSocketEventHandlers as HandlerMap } from "./websocket.types";
import {
  bindMessageEventHandlers,
  bindRoomEventHandlers,
  bindUserEventHandlers,
  bindErrorEventHandlers,
  bindSupportAdminEventHandlers,
} from "./event-binders";
import * as CoreHandlers from "./core-handlers";

// WebSocket event handlers - chỉ wrap lại các hàm xử lý chính từ core-handlers
export class WebSocketEventHandlers {
  static handleConnectionSuccess(
    socket: Socket,
    data: WsResponse<{ userId: string; rooms: string[] }>
  ) {
    CoreHandlers.handleConnectionSuccess(socket, data);
  }

  static handleRooms(data: WsResponse<ChatRoom[]>, socket?: Socket) {
    CoreHandlers.handleRooms(data, socket);
  }

  static handleMessages(
    data: WsResponse<{
      roomId: string;
      data: Message[];
      hasMore: boolean;
      before?: string;
    }>
  ) {
    CoreHandlers.handleMessages(data);
  }

  static handleNewMessage(socket: Socket, data: WsResponse<Message>) {
    CoreHandlers.handleNewMessage(socket, data);
  }

  static handleUnreadCountUpdated(
    data: WsResponse<{ roomId: string; unreadCount: number }>
  ) {
    CoreHandlers.handleUnreadCountUpdated(data);
  }

  static handleAllOnlineUsers(data: WsResponse<UsersOnline[]>) {
    CoreHandlers.handleAllOnlineUsers(data);
  }

  static handleUserOnline(
    data: WsResponse<{ userId: string; roomId: string }>
  ) {
    CoreHandlers.handleUserOnline(data);
  }

  static handleUserOffline(
    data: WsResponse<{ userId: string; roomId: string }>
  ) {
    CoreHandlers.handleUserOffline(data);
  }

  static handleError(data: WsResponse) {
    CoreHandlers.handleError(data);
  }

  static handleAuthError(data: WsResponse) {
    CoreHandlers.handleAuthError(data);
  }

  static handleRoomOnlineMembers(
    data: WsResponse<{ roomId: string; onlineMemberIds: string[] }>
  ) {
    CoreHandlers.handleRoomOnlineMembers(data);
  }

  static handleRoomMarkedRead(data: WsResponse<{ roomId: string }>) {
    CoreHandlers.handleRoomMarkedRead(data);
  }

  static emitUserRequestSupport(socket: Socket) {
    if (socket && socket.connected) {
      socket.emit("user_request_support");
    } else {
      console.error("[WebSocketEventHandlers] Socket not connected");
    }
  }

  static setupEventHandlers(socket: Socket, handlers?: HandlerMap) {
    bindMessageEventHandlers(socket, handlers || {});
    bindRoomEventHandlers(socket, handlers || {});
    bindUserEventHandlers(socket, handlers || {});
    bindErrorEventHandlers(socket, handlers || {});
    bindSupportAdminEventHandlers(socket, handlers || {});
  }

  static removeEventHandlers() {
    // This will be handled by the socket instance when it's disconnected
  }
}
