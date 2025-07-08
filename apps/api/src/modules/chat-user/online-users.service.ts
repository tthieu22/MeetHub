import { Injectable } from '@nestjs/common';

@Injectable()
export class OnlineUsersService {
  private onlineUsers = new Set<string>();
  private clientUserMap = new Map<string, string>();

  addOnlineUser(clientId: string, userId: string): void {
    this.onlineUsers.add(userId);
    this.clientUserMap.set(clientId, userId);
  }

  removeOnlineUser(clientId: string): string | null {
    const userId = this.clientUserMap.get(clientId);
    if (userId) {
      this.onlineUsers.delete(userId);
      this.clientUserMap.delete(clientId);
      return userId;
    }
    return null;
  }

  getOnlineUsers(): string[] {
    const users = Array.from(this.onlineUsers);
    return users;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getClientCount(): number {
    return this.clientUserMap.size;
  }
}
