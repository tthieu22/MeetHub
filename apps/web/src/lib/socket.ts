import { io, Socket } from "socket.io-client";
const URL = process.env.NEXT_PUBLIC_API_URL;
let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(URL, {
      transports: ["websocket"],
      autoConnect: true,
    });

    // Event handlers
    socket.on("connect", () => {
      console.log("Connected to WebSocket server");
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket server");
    });

    socket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
