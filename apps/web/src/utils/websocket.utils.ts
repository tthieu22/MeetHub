import { WebSocketEventName } from "@web/types/websocket";

// WebSocket utilities
export class WebSocketUtils {
  // Check if WebSocket is supported
  static isSupported(): boolean {
    return typeof window !== "undefined" && "WebSocket" in window;
  }

  // Get WebSocket connection status
  static getConnectionStatus(
    socket: any
  ): "connected" | "connecting" | "disconnected" {
    if (!socket) return "disconnected";
    if (socket.connected) return "connected";
    if (socket.connecting) return "connecting";
    return "disconnected";
  }

  // Format WebSocket error message
  static formatErrorMessage(error: any): string {
    if (typeof error === "string") return error;
    if (error?.message) return error.message;
    if (error?.code) return `Error ${error.code}`;
    return "Unknown WebSocket error";
  }

  // Validate WebSocket event name
  static isValidEventName(eventName: string): boolean {
    return Object.values(WebSocketEventName).includes(
      eventName as WebSocketEventName
    );
  }

  // Retry connection with exponential backoff
  static async retryConnection(
    connectFn: () => Promise<void>,
    maxRetries: number = 5,
    baseDelay: number = 1000
  ): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        await connectFn();
        return; // Success
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw error; // Max retries reached
        }

        // Exponential backoff
        const delay = baseDelay * Math.pow(2, retries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  // Debounce function for WebSocket events
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  // Throttle function for WebSocket events
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;

    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  // Parse WebSocket URL
  static parseWebSocketUrl(url: string): {
    protocol: string;
    host: string;
    port: string;
    path: string;
  } {
    try {
      const urlObj = new URL(url);
      return {
        protocol: urlObj.protocol,
        host: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname,
      };
    } catch (error) {
      throw new Error(`Invalid WebSocket URL: ${url}`);
    }
  }

  // Generate WebSocket URL with query parameters
  static buildWebSocketUrl(
    baseUrl: string,
    params: Record<string, string> = {}
  ): string {
    const url = new URL(baseUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  // Check if WebSocket connection is healthy
  static isConnectionHealthy(socket: any): boolean {
    if (!socket) return false;

    // Check if socket is connected
    if (!socket.connected) return false;

    // Check if socket has recent activity (optional)
    // This depends on your implementation

    return true;
  }

  // Get WebSocket connection info
  static getConnectionInfo(socket: any): {
    connected: boolean;
    connecting: boolean;
    disconnected: boolean;
    id?: string;
  } {
    if (!socket) {
      return {
        connected: false,
        connecting: false,
        disconnected: true,
      };
    }

    return {
      connected: socket.connected || false,
      connecting: socket.connecting || false,
      disconnected: !socket.connected && !socket.connecting,
      id: socket.id,
    };
  }
}
