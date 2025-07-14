"use client";

import { useWebSocket } from "@web/hooks/useWebSocket";

export function WebSocketProvider() {
  // Always call the hook, let it handle authentication internally
  useWebSocket();

  return null;
}
