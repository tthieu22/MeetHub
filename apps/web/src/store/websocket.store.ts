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

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  error: null,
  socket: null,

  connect: () => {
    const { socket } = get();
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

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: false, // Tắt tự động reconnect
      auth: {
        token: access_token,
      },
    });

    // Setup event listeners
    newSocket.on("connect", () => {
      const { isConnected } = get();
      if (!isConnected) {
        set({ isConnected: true, isConnecting: false, error: null });
      }
    });

    newSocket.on("disconnect", () => {
      const { isConnected } = get();
      if (isConnected) {
        set({ isConnected: false, isConnecting: false });
      }
    });

    newSocket.on("connect_error", () => {
      const { error } = get();
      const newError = "Kết nối WebSocket thất bại";
      if (error !== newError) {
        set({
          isConnected: false,
          isConnecting: false,
          error: newError,
        });
      }
    });

    newSocket.connect();

    set({ socket: newSocket });
    return newSocket;
  },

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
