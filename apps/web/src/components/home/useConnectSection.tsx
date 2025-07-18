import { useEffect, useState, useCallback, useMemo } from "react";
import { notification } from "antd";
import { useRouter } from "next/navigation";

import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { WS_EVENTS } from "@web/constants/websocket.events";
import usersApiService, { User } from "@web/services/api/users.api";
import invitationApiService, {
  Invitation,
} from "@web/services/api/invitation.api";

interface UserWithStatus extends User {
  isOnline: boolean;
  chated?: boolean;
}

// Cache for users data
const usersCache = new Map<
  string,
  { data: UserWithStatus[]; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useConnectSection(searchValue?: string) {
  const [api, contextHolder] = notification.useNotification();

  const allOnline = useChatStore((s) => s.allOnline);
  const rooms = useChatStore((s) => s.rooms);
  const { currentUser } = useUserStore();
  const { isConnected, socket } = useWebSocketStore();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showAllOfflineUsers, setShowAllOfflineUsers] = useState(false);

  // Fetch users from API with caching
  const fetchUsers = useCallback(
    async (forceRefresh = false) => {
      try {
        // Check cache first
        const cacheKey = `users_${currentUser?._id || "anonymous"}`;
        const cached = usersCache.get(cacheKey);

        if (
          !forceRefresh &&
          cached &&
          Date.now() - cached.timestamp < CACHE_DURATION
        ) {
          setUsers(cached.data);
          setLoading(false);
          return;
        }

        setRefreshing(true);
        setError(null);

        const result = await usersApiService.getUsers({ limit: 100, page: 1 });

        if (result.success && result.data) {
          const usersWithStatus: UserWithStatus[] = result.data.map(
            (user: User) => ({
              ...user,
              isOnline: allOnline.some(
                (onlineUser) => onlineUser.userId === user.userId
              ),
              chated: user?.chated || false,
            })
          );

          const filteredUsers = usersWithStatus
            .filter((user) => user.userId !== currentUser?._id)
            .sort((a, b) => {
              if (a.isOnline && !b.isOnline) return -1;
              if (!a.isOnline && b.isOnline) return 1;
              return a.name.localeCompare(b.name);
            })
            .slice(0, 20);

          setUsers(filteredUsers);

          usersCache.set(cacheKey, {
            data: filteredUsers,
            timestamp: Date.now(),
          });
        } else {
          throw new Error(result.message || "Failed to fetch users");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load users";
        setError(errorMessage); // chỉ set state, không gọi api.error ở đây
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allOnline, currentUser?._id]
  );
  useEffect(() => {
    if (error) {
      api.error({
        message: "Lỗi tải dữ liệu",
        description: error,
        placement: "topRight",
      });
    }
  }, [error]);

  const fetchInvitations = useCallback(async () => {
    try {
      const result = await invitationApiService.getReceivedInvitations();

      if (result.success && result.data) {
        setInvitations(result.data);
      }
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  }, []);

  const handleAcceptInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const result = await invitationApiService.respondToInvitation(
          invitationId,
          "accept"
        );

        if (result.success) {
          api.success({
            message: "Thành công!",
            description:
              "Lời mời đã được chấp nhận và cuộc trò chuyện đã được tạo.",
            placement: "topRight",
            duration: 3,
          });
          fetchInvitations();
          fetchUsers(true);

          // Navigate to chat if conversation was created
          if (result.data?.conversationId) {
            router.push(`/chat?roomId=${result.data.conversationId}`);
          }
        }
      } catch (error: unknown) {
        console.error("Error accepting invitation:", error);
        let errorMessage = "Có lỗi xảy ra khi chấp nhận lời mời";
        if (error && typeof error === "object" && "response" in error) {
          const responseError = error as {
            response?: { data?: { message?: string } };
          };
          errorMessage = responseError.response?.data?.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        api.error({
          message: "Lỗi",
          description: errorMessage,
          placement: "topRight",
          duration: 5,
        });
      }
    },
    [fetchInvitations, fetchUsers, router, api]
  );

  const handleDeclineInvitation = useCallback(
    async (invitationId: string) => {
      try {
        const result = await invitationApiService.respondToInvitation(
          invitationId,
          "decline"
        );

        if (result.success) {
          api.info({
            message: "Đã từ chối",
            description: "Lời mời đã được từ chối thành công.",
            placement: "topRight",
            duration: 3,
          });
          // Refresh invitations
          fetchInvitations();
        }
      } catch (error: unknown) {
        console.error("Error declining invitation:", error);
        let errorMessage = "Có lỗi xảy ra khi từ chối lời mời";
        if (error && typeof error === "object" && "response" in error) {
          const responseError = error as {
            response?: { data?: { message?: string } };
          };
          errorMessage = responseError.response?.data?.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        api.error({
          message: "Lỗi",
          description: errorMessage,
          placement: "topRight",
          duration: 5,
        });
      }
    },
    [fetchInvitations, api]
  );

  // Handle send invitation
  const handleSendInvitation = useCallback(
    async (userId: string) => {
      try {
        const result = await invitationApiService.createInvitation({
          receiverId: userId,
          message: "Tôi muốn kết nối với bạn!",
        });

        if (result.success) {
          api.success({
            message: "Đã gửi lời mời!",
            description: "Lời mời chat đã được gửi thành công.",
            placement: "topRight",
            duration: 3,
          });
          // Refresh users to update chat status
          fetchUsers(true);
        } else {
          // Xử lý lỗi từ backend response
          const errorMessage =
            result.message || "Có lỗi xảy ra khi gửi lời mời";

          // Nếu lỗi là "đã có cuộc trò chuyện", refresh lại danh sách users
          if (
            errorMessage.includes("đã có cuộc trò chuyện") ||
            errorMessage.includes("already have a conversation")
          ) {
            api.info({
              message: "Đã có cuộc trò chuyện",
              description:
                "Đã có cuộc trò chuyện với người này, đang cập nhật...",
              placement: "topRight",
              duration: 4,
            });
            fetchUsers(true);
            return;
          }

          // Nếu lỗi là "đã gửi lời mời", hiển thị thông báo thân thiện
          if (
            errorMessage.includes("đã gửi lời mời") ||
            errorMessage.includes("already sent invitation") ||
            errorMessage.includes("invitation already exists") ||
            errorMessage.includes("invitation exists")
          ) {
            api.info({
              message: "Đã gửi lời mời",
              description:
                "Bạn đã gửi lời mời cho người này rồi. Vui lòng chờ phản hồi.",
              placement: "topRight",
              duration: 4,
            });
            return;
          }

          // Nếu lỗi là "không thể gửi lời mời cho chính mình"
          if (
            errorMessage.includes("không thể mời chính mình") ||
            errorMessage.includes("cannot send invitation to yourself") ||
            errorMessage.includes("self invitation")
          ) {
            api.warning({
              message: "Không thể gửi lời mời",
              description: "Bạn không thể gửi lời mời cho chính mình.",
              placement: "topRight",
              duration: 4,
            });
            return;
          }

          // Lỗi khác
          api.error({
            message: "Lỗi gửi lời mời",
            description: errorMessage,
            placement: "topRight",
            duration: 5,
          });
        }
      } catch (error: unknown) {
        console.error("Error sending invitation:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Có lỗi xảy ra khi gửi lời mời";

        api.error({
          message: "Lỗi gửi lời mời",
          description: errorMessage,
          placement: "topRight",
          duration: 5,
        });
      }
    },
    [fetchUsers, api]
  );

  // Handle chat navigation
  const handleChat = useCallback(
    (roomId: string) => {
      router.push(`/chat?roomId=${roomId}`);
    },
    [router]
  );

  // Handle refresh
  const handleRefresh = useCallback(() => {
    fetchUsers(true);
    fetchInvitations();
  }, [fetchUsers, fetchInvitations]);

  // Memoized user lists for performance
  const { onlineUsers, offlineUsers } = useMemo(
    () => ({
      onlineUsers: users.filter((user) => user.isOnline),
      offlineUsers: users.filter((user) => !user.isOnline),
    }),
    [users]
  );

  const offlineUsersLimited = showAllOfflineUsers
    ? offlineUsers
    : offlineUsers.slice(0, 10);
  const handleShowMoreOffline = () => setShowAllOfflineUsers(true);

  // Thêm filter khi showSearchBox
  const filteredUsers = useMemo(() => {
    if (!searchValue) return users;
    const v = searchValue.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(v) ||
        u.userId?.toLowerCase().includes(v) ||
        u.email?.toLowerCase().includes(v)
    );
  }, [users, searchValue]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
    fetchInvitations();
  }, [fetchUsers, fetchInvitations]);

  // Load rooms và allOnline users khi component mount
  useEffect(() => {
    if (isConnected && socket) {
      if (rooms.length === 0) {
        socket.emit(WS_EVENTS.GET_ROOMS);
      }
      socket.emit("get_all_online_users");
    }
  }, [isConnected, socket, rooms.length]);

  // Update online status when allOnline changes - realtime
  useEffect(() => {
    if (users.length > 0) {
      const updatedUsers = users.map((user) => ({
        ...user,
        isOnline: allOnline.some(
          (onlineUser) => onlineUser.userId === user.userId
        ),
      }));
      setUsers(updatedUsers);
    }
  }, [allOnline, users.length]);

  // Real-time online status update with interval
  useEffect(() => {
    if (!isConnected || users.length === 0) return;

    const updateOnlineStatus = () => {
      setUsers((prevUsers) =>
        prevUsers.map((user) => ({
          ...user,
          isOnline: allOnline.some(
            (onlineUser) => onlineUser.userId === user.userId
          ),
        }))
      );
    };

    // Update immediately
    updateOnlineStatus();

    // Set up interval for real-time updates
    const interval = setInterval(updateOnlineStatus, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isConnected, users.length, allOnline]);

  return {
    // State
    loading,
    refreshing,
    error,
    users,
    invitations,
    onlineUsers: filteredUsers.filter((u) => u.isOnline),
    offlineUsers: filteredUsers.filter((u) => !u.isOnline),
    // Actions
    handleSendInvitation,
    handleAcceptInvitation,
    handleDeclineInvitation,
    handleChat,
    handleRefresh,
    handleShowMoreOffline,
    showAllOfflineUsers,
    // Notification context
    contextHolder,
  };
}
