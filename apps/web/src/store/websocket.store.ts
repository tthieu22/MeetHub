import { create } from "zustand";
import { Socket } from "socket.io-client";
import { io } from "socket.io-client";
const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8000";

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  socket: Socket | null;
  connect: () => Socket | null;
  disconnect: () => void;
  setError: (error: string | null) => void;
  setSocket: (socket: Socket | null) => void;
  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
}

// Quản lý kết nối socket
export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  socket: null,

  connect: () => {
    const { socket, isConnecting } = get();
    // Đang connecting
    if (isConnecting) {
      return socket;
    }
    // Nếu đã kết nối
    if (socket?.connected) {
      return socket;
    }

    set({ isConnecting: true, error: null });

    let access_token: string | undefined = undefined;
    if (typeof window !== "undefined") {
      access_token = localStorage.getItem("access_token") || undefined;
    }

    if (!access_token) {
      set({
        isConnecting: false,
        error: "Không có token xác thực",
      });
      return null;
    }
    // Khởi tạo 1 soket
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: false, // Tắt tự động reconnect
      auth: {
        token: access_token,
      },
    });

    // Threads connect
    newSocket.on("connect", () => {
      const { isConnected } = get();
      if (!isConnected) {
        set({ isConnected: true, isConnecting: false, error: null });
      }
    });
    // Threads disconnect
    newSocket.on("disconnect", () => {
      const { isConnected } = get();
      if (isConnected) {
        set({ isConnected: false, isConnecting: false });
      }
    });
    // Threads Error
    newSocket.on("connect_error", () => {
      const { error: currentError } = get();
      const newError = "Kết nối WebSocket thất bại";
      if (currentError !== newError) {
        set({
          isConnected: false,
          isConnecting: false,
          error: newError,
        });
      }
    });
    // Connect
    newSocket.connect();
    // Set socket only one
    set({ socket: newSocket });
    // Return socket
    return newSocket;
  },
  // Disconnect
  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({
      isConnected: false,
      isConnecting: false,
      socket: null,
      error: null,
    });
  },

  setError: (error: string | null) => {
    const { error: currentError, isConnecting } = get();
    if (currentError !== error || isConnecting) {
      set({ error, isConnecting: false });
    }
  },

  setSocket: (socket: Socket | null) => {
    const { socket: currentSocket } = get();
    if (currentSocket !== socket) {
      set({ socket });
    }
  },

  setConnected: (connected: boolean) => {
    const { isConnected } = get();
    if (isConnected !== connected) {
      set({ isConnected: connected });
    }
  },

  setConnecting: (connecting: boolean) => {
    const { isConnecting } = get();
    if (isConnecting !== connecting) {
      set({ isConnecting: connecting });
    }
  },
}));
