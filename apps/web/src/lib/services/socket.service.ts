import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL;
export const createSocket = (): Socket => {
  let access_token: string | undefined = undefined;
  if (typeof window !== "undefined") {
    access_token = localStorage.getItem("access_token") || undefined;
  }
  return io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
    auth: {
      token: access_token,
    },
  });
};
