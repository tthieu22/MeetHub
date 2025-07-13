import { UsersOnline } from "@web/types/chat";

/**
 * Lọc danh sách online users, loại bỏ current user
 * @param allOnline - Danh sách tất cả users online
 * @param currentUserId - ID của user hiện tại
 * @returns Danh sách online users không bao gồm current user
 */
export const filterOnlineUsersExcludingCurrent = (
  allOnline: UsersOnline[],
  currentUserId?: string
): UsersOnline[] => {
  if (!currentUserId) {
    return allOnline.filter((user) => user.isOnline);
  }

  return allOnline.filter(
    (user) => user.isOnline && user.userId !== currentUserId
  );
};
