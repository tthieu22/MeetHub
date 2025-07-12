// Storage utilities for localStorage and sessionStorage
export class StorageUtils {
  // Local Storage
  static setLocalItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }

  static getLocalItem<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return defaultValue || null;
    }
  }

  static removeLocalItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from localStorage:", error);
    }
  }

  static clearLocalStorage(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }

  // Session Storage
  static setSessionItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error("Error saving to sessionStorage:", error);
    }
  }

  static getSessionItem<T = any>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return defaultValue || null;
      return JSON.parse(item);
    } catch (error) {
      console.error("Error reading from sessionStorage:", error);
      return defaultValue || null;
    }
  }

  static removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing from sessionStorage:", error);
    }
  }

  static clearSessionStorage(): void {
    try {
      sessionStorage.clear();
    } catch (error) {
      console.error("Error clearing sessionStorage:", error);
    }
  }

  // Auth specific storage
  static setToken(token: string): void {
    this.setLocalItem("token", token);
  }

  static getToken(): string | null {
    return this.getLocalItem<string>("token");
  }

  static removeToken(): void {
    this.removeLocalItem("token");
  }

  static setUser(user: any): void {
    this.setLocalItem("user", user);
  }

  static getUser<T = any>(): T | null {
    return this.getLocalItem<T>("user");
  }

  static removeUser(): void {
    this.removeLocalItem("user");
  }

  // Chat specific storage
  static setChatSettings(settings: any): void {
    this.setLocalItem("chat_settings", settings);
  }

  static getChatSettings<T = any>(): T | null {
    return this.getLocalItem<T>("chat_settings");
  }

  static setLastReadMessage(roomId: string, messageId: string): void {
    const key = `last_read_${roomId}`;
    this.setLocalItem(key, messageId);
  }

  static getLastReadMessage(roomId: string): string | null {
    const key = `last_read_${roomId}`;
    return this.getLocalItem<string>(key);
  }

  // WebSocket specific storage
  static setWebSocketConfig(config: any): void {
    this.setLocalItem("websocket_config", config);
  }

  static getWebSocketConfig<T = any>(): T | null {
    return this.getLocalItem<T>("websocket_config");
  }

  // Utility functions
  static hasItem(key: string, storage: "local" | "session" = "local"): boolean {
    try {
      if (storage === "local") {
        return localStorage.getItem(key) !== null;
      } else {
        return sessionStorage.getItem(key) !== null;
      }
    } catch (error) {
      return false;
    }
  }

  static getStorageSize(storage: "local" | "session" = "local"): number {
    try {
      let total = 0;
      const storageObj = storage === "local" ? localStorage : sessionStorage;

      for (let key in storageObj) {
        if (storageObj.hasOwnProperty(key)) {
          total += storageObj[key].length + key.length;
        }
      }

      return total;
    } catch (error) {
      return 0;
    }
  }

  static clearAuthData(): void {
    this.removeToken();
    this.removeUser();
  }

  static clearChatData(): void {
    // Remove all chat-related items
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("last_read_") || key === "chat_settings") {
        this.removeLocalItem(key);
      }
    });
  }
}
