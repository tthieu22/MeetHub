import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001"; // Sửa lại URL nếu backend chạy cổng khác

export const createSocket = (): Socket => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : undefined;
  return io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: false,
    query: {
      access_token: token || "",
    },
  });
};

// Hướng dẫn sử dụng:
// import { createSocket } from './socket.service';
// const socket = createSocket();
// socket.connect();
//
// Nếu access_token thay đổi (user login/logout), nên tạo lại socket mới để truyền token mới.

// Có thể export sẵn 1 instance nếu muốn dùng singleton
// export const socket = createSocket();
