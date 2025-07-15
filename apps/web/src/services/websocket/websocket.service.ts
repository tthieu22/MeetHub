import { io, Socket } from "socket.io-client";
import { WebSocketEventName, WsResponse } from "@web/types/websocket";
import { Message, ChatRoom } from "@web/types/chat";
import {
  WS_CONFIG,
  WS_EVENTS,
  WS_RESPONSE_EVENTS,
} from "@web/constants/websocket.events";
import {
  WebSocketServiceInterface,
  WebSocketEventHandlers,
} from "./websocket.types";

class WebSocketService implements WebSocketServiceInterface {
  private socket: Socket | null = null;
  private eventHandlers: WebSocketEventHandlers = {};
  private isConnecting = false;

  async connect(token: string): Promise<void> {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      this.socket = io(WS_CONFIG.URL, {
        auth: { token },
        transports: WS_CONFIG.TRANSPORTS.slice(),
        autoConnect: WS_CONFIG.AUTO_CONNECT,
        reconnection: WS_CONFIG.RECONNECTION,
        reconnectionAttempts: WS_CONFIG.RECONNECTION_ATTEMPTS,
        reconnectionDelay: WS_CONFIG.RECONNECTION_DELAY,
      });

      this.setupEventListeners();
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Event emitters
  emitGetRooms(): void {
    this.socket?.emit(WS_EVENTS.GET_ROOMS);
  }

  emitGetMessages(roomId: string, before?: string): void {
    this.socket?.emit(WS_EVENTS.GET_MESSAGES, { roomId, before });
  }

  emitCreateMessage(roomId: string, text: string): void {
    this.socket?.emit(WS_EVENTS.CREATE_MESSAGE, { roomId, text });
  }

  emitMarkRoomRead(roomId: string): void {
    this.socket?.emit(WS_EVENTS.MARK_ROOM_READ, { roomId });
  }

  emitGetUnreadCount(roomId: string): void {
    this.socket?.emit(WS_EVENTS.GET_UNREAD_COUNT, { roomId });
  }

  emitJoinRoom(roomId: string): void {
    this.socket?.emit(WS_EVENTS.JOIN_ROOM, { roomId });
  }

  // ===== Support/Admin event emitters =====
  /** Emit yêu cầu hỗ trợ tới admin */
  emitUserRequestSupport(): void {
    this.socket?.emit(WS_EVENTS.USER_REQUEST_SUPPORT);
  }
  /** Admin join vào phòng support */
  emitAdminJoinSupportRoom(roomId: string): void {
    this.socket?.emit(WS_EVENTS.ADMIN_JOIN_SUPPORT_ROOM, { roomId });
  }
  /** Đóng phòng support */
  emitCloseSupportRoom(roomId: string): void {
    this.socket?.emit(WS_EVENTS.CLOSE_SUPPORT_ROOM, { roomId });
  }

  // Event listeners
  onConnectionSuccess(
    callback: (data: WsResponse<{ userId: string; rooms: string[] }>) => void
  ): void {
    this.eventHandlers.onConnectionSuccess = callback;
  }

  onRooms(callback: (data: WsResponse<ChatRoom[]>) => void): void {
    this.eventHandlers.onRooms = callback;
  }

  onMessages(
    callback: (
      data: WsResponse<{ data: Message[]; hasMore: boolean; before?: string }>
    ) => void
  ): void {
    this.eventHandlers.onMessages = callback;
  }

  onNewMessage(callback: (data: WsResponse<Message>) => void): void {
    this.eventHandlers.onNewMessage = callback;
  }

  onUnreadCountUpdated(
    callback: (
      data: WsResponse<{ roomId: string; unreadCount: number }>
    ) => void
  ): void {
    this.eventHandlers.onUnreadCountUpdated = callback;
  }

  onUserOnline(
    callback: (data: WsResponse<{ userId: string; roomId: string }>) => void
  ): void {
    this.eventHandlers.onUserOnline = callback;
  }

  onUserOffline(
    callback: (data: WsResponse<{ userId: string; roomId: string }>) => void
  ): void {
    this.eventHandlers.onUserOffline = callback;
  }

  onError(callback: (data: WsResponse) => void): void {
    this.eventHandlers.onError = callback;
  }

  onAuthError(callback: (data: WsResponse) => void): void {
    this.eventHandlers.onAuthError = callback;
  }

  off(event: WebSocketEventName): void {
    this.socket?.off(event);
  }

  offAll(): void {
    this.socket?.removeAllListeners();
  }

  // ===== Support/Admin event listeners =====
  /** Khi phòng support đang pending (chưa có admin) */
  onSupportRoomPending(callback: () => void): void {
    this.eventHandlers.onSupportRoomPending = callback;
  }
  /** Khi user được gán admin */
  onSupportRoomAssigned(
    callback: (data: {
      roomId: string;
      admin?: { name?: string; _id?: string };
    }) => void
  ): void {
    this.eventHandlers.onSupportRoomAssigned = callback;
  }
  /** Khi admin join vào phòng */
  onSupportAdminJoined(
    callback: (data: {
      roomId: string;
      admin?: { name?: string; _id?: string };
    }) => void
  ): void {
    this.eventHandlers.onSupportAdminJoined = callback;
  }
  /** Khi admin nhận ticket hỗ trợ */
  onSupportTicketAssigned(
    callback: (data: { roomId: string; userId: string }) => void
  ): void {
    this.eventHandlers.onSupportTicketAssigned = callback;
  }
  /** Khi admin bị đổi do timeout */
  onSupportAdminChanged(
    callback: (data: {
      roomId: string;
      userId: string;
      newAdminId: string;
    }) => void
  ): void {
    this.eventHandlers.onSupportAdminChanged = callback;
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {});

    this.socket.on("disconnect", () => {});

    // Response events - match với backend WebSocketEventName
    this.socket.on(
      WS_RESPONSE_EVENTS.CONNECTION_SUCCESS,
      (data: WsResponse<{ userId: string; rooms: string[] }>) => {
        this.eventHandlers.onConnectionSuccess?.(data);
      }
    );

    this.socket.on(WS_RESPONSE_EVENTS.ROOMS, (data: WsResponse<ChatRoom[]>) => {
      this.eventHandlers.onRooms?.(data);
    });

    this.socket.on(
      WS_RESPONSE_EVENTS.MESSAGES,
      (
        data: WsResponse<{ data: Message[]; hasMore: boolean; before?: string }>
      ) => {
        this.eventHandlers.onMessages?.(data);
      }
    );

    this.socket.on(
      WS_RESPONSE_EVENTS.NEW_MESSAGE,
      (data: WsResponse<Message>) => {
        this.eventHandlers.onNewMessage?.(data);
      }
    );

    this.socket.on(
      WS_RESPONSE_EVENTS.UNREAD_COUNT_UPDATED,
      (data: WsResponse<{ roomId: string; unreadCount: number }>) => {
        this.eventHandlers.onUnreadCountUpdated?.(data);
      }
    );

    this.socket.on(
      WS_RESPONSE_EVENTS.USER_ONLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        this.eventHandlers.onUserOnline?.(data);
      }
    );

    this.socket.on(
      WS_RESPONSE_EVENTS.USER_OFFLINE,
      (data: WsResponse<{ userId: string; roomId: string }>) => {
        this.eventHandlers.onUserOffline?.(data);
      }
    );

    this.socket.on(WS_RESPONSE_EVENTS.ERROR, (data: WsResponse) => {
      this.eventHandlers.onError?.(data);
    });

    this.socket.on(WS_RESPONSE_EVENTS.AUTH_ERROR, (data: WsResponse) => {
      this.eventHandlers.onAuthError?.(data);
    });

    // ===== Support/Admin events =====
    this.socket.on(WS_RESPONSE_EVENTS.SUPPORT_ROOM_PENDING, () => {
      this.eventHandlers.onSupportRoomPending?.();
    });
    this.socket.on(
      WS_RESPONSE_EVENTS.SUPPORT_ROOM_ASSIGNED,
      (data: { roomId: string; admin?: { name?: string; _id?: string } }) => {
        this.eventHandlers.onSupportRoomAssigned?.(data);
      }
    );
    this.socket.on(
      WS_RESPONSE_EVENTS.SUPPORT_ADMIN_JOINED,
      (data: { roomId: string; admin?: { name?: string; _id?: string } }) => {
        this.eventHandlers.onSupportAdminJoined?.(data);
      }
    );
    this.socket.on(
      WS_RESPONSE_EVENTS.SUPPORT_TICKET_ASSIGNED,
      (data: { roomId: string; userId: string }) => {
        this.eventHandlers.onSupportTicketAssigned?.(data);
      }
    );
    this.socket.on(
      WS_RESPONSE_EVENTS.SUPPORT_ADMIN_CHANGED,
      (data: { roomId: string; userId: string; newAdminId: string }) => {
        this.eventHandlers.onSupportAdminChanged?.(data);
      }
    );
  }
}

// Singleton instance
export const webSocketService = new WebSocketService();
