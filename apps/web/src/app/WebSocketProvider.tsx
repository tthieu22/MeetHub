'use client';

import { useWebSocket } from '@web/hooks/useWebSocket';

export function WebSocketProvider() {
  useWebSocket();
  return null;
} 