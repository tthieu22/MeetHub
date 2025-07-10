import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    let access_token: string | undefined = undefined;
    if (typeof window !== "undefined") {
      access_token = localStorage.getItem("access_token") || undefined;
    }
    socket = io(SOCKET_URL!, {
      transports: ["websocket"],
      autoConnect: false,
      auth: {
        token: access_token,
      },
    });
  }
  return socket;
};

export const updateSocketToken = (newToken: string) => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  socket = io(SOCKET_URL!, {
    transports: ["websocket"],
    autoConnect: false,
    auth: {
      token: newToken,
    },
  });
};
