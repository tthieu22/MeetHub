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
    console.log("🔌 [WebSocket Store] Attempting to connect...");

    const { socket } = get();
    if (socket?.connected) {
      return socket;
    }

    console.log("🔌 [WebSocket Store] Creating new socket connection...");
    set({ isConnecting: true, error: null });

    let access_token: string | undefined = undefined;
    if (typeof window !== "undefined") {
      access_token = localStorage.getItem("access_token") || undefined;
      console.log(
        "🔑 [WebSocket Store] Access token:",
        access_token ? "Found" : "Not found"
      );
    }

    if (!access_token) {
      console.error("❌ [WebSocket Store] No access token found");
      set({
        isConnecting: false,
        error: "Không có token xác thực",
      });
      return null;
    }

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: false,
      auth: {
        token: access_token,
      },
    });

    // Setup event listeners
    newSocket.on("connect", () => {
      console.log("🔌 [WebSocket Store] WebSocket connected successfully");
      set({ isConnected: true, isConnecting: false, error: null });
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 [WebSocket Store] WebSocket disconnected");
      set({ isConnected: false, isConnecting: false });
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ [WebSocket Store] WebSocket connection error:", error);
      set({
        isConnected: false,
        isConnecting: false,
        error: "Kết nối WebSocket thất bại",
      });
    });

    // Connect to server
    console.log("🔌 [WebSocket Store] Connecting to server:", SOCKET_URL);
    newSocket.connect();

    set({ socket: newSocket });
    console.log("🔌 [WebSocket Store] Socket created and connecting...");
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
