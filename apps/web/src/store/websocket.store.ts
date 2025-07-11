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
      set({ isConnected: true, isConnecting: false, error: null });
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false, isConnecting: false });
    });

    newSocket.on("connect_error", () => {
      set({
        isConnected: false,
        isConnecting: false,
        error: "Kết nối WebSocket thất bại",
      });
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
    set({ error, isConnecting: false });
  },

  setSocket: (socket: Socket | null) => {
    set({ socket });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  setConnecting: (connecting: boolean) => {
    set({ isConnecting: connecting });
  },
}));
