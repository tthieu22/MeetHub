"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Typography,
  Card,
  Space,
  Avatar,
  Tag,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { WS_EVENTS } from "@web/constants/websocket.events";
import CustomButton from "@web/components/CustomButton";
import LoadingCard from "./LoadingCard";
import usersApiService, { User } from "@web/services/api/users.api";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface ConnectionRequest {
  id: string;
  name: string;
  type: "connection" | "meeting";
  team?: string;
  mutualConnections?: number;
  meetingTitle?: string;
  meetingTime?: string;
}

interface ConnectSectionProps {
  connectionRequests: ConnectionRequest[];
  onAcceptRequest: () => void;
  onDeclineRequest: () => void;
}

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

export default function ConnectSection({
  connectionRequests,
  onAcceptRequest,
  onDeclineRequest,
}: ConnectSectionProps) {
  const allOnline = useChatStore((s) => s.allOnline);
  const rooms = useChatStore((s) => s.rooms);
  const { currentUser } = useUserStore();
  const { isConnected, socket } = useWebSocketStore();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

        const result = await usersApiService.getUsers({ limit: 50, page: 1 });

        if (result.success && result.data) {
          // Merge with online status from WebSocket store - realtime
          const usersWithStatus: UserWithStatus[] = result.data.map(
            (user: User) => ({
              ...user,
              isOnline: allOnline.some(
                (onlineUser) => onlineUser.userId === user.userId
              ),
              chated: user?.chated || false,
            })
          );

          // Filter out current user and sort by online status
          const filteredUsers = usersWithStatus
            .filter((user) => user.userId !== currentUser?._id)
            .sort((a, b) => {
              // Online users first, then by name
              if (a.isOnline && !b.isOnline) return -1;
              if (!a.isOnline && b.isOnline) return 1;
              return a.name.localeCompare(b.name);
            })
            .slice(0, 8); // Limit to 8 users

          setUsers(filteredUsers);

          // Update cache
          usersCache.set(cacheKey, {
            data: filteredUsers,
            timestamp: Date.now(),
          });
        } else {
          throw new Error(result.message || "Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load users";
        setError(errorMessage);
        message.error(errorMessage);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [allOnline, currentUser?._id]
  );

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Memoized user lists for performance
  const { onlineUsers, offlineUsers } = useMemo(
    () => ({
      onlineUsers: users.filter((user) => user.isOnline),
      offlineUsers: users.filter((user) => !user.isOnline),
    }),
    [users]
  );

  const handleRefresh = () => {
    fetchUsers(true);
  };

  // Chuyển đến cuộc trò chuyện với user
  const handleChatClick = useCallback(
    (targetUserId: string, roomId?: string | null) => {
      if (!currentUser?._id) return;

      if (roomId) {
        // Sử dụng roomId từ API nếu có
        router.push(`/chat?roomId=${roomId}`);
      } else {
        // Fallback: tìm room trong danh sách hiện tại
        const directRoom = rooms.find((room) => {
          if (room.isGroup) return false;

          const memberIds = room.members.map((member) => member.userId);
          return (
            memberIds.length === 2 &&
            memberIds.includes(currentUser._id) &&
            memberIds.includes(targetUserId)
          );
        });

        if (directRoom) {
          router.push(`/chat?roomId=${directRoom.roomId}`);
        }
      }
    },
    [currentUser?._id, rooms, router]
  );

  if (loading) {
    return (
      <LoadingCard
        title={
          <span>
            <TeamOutlined style={{ marginRight: 8 }} />
            Connect & Chat
          </span>
        }
        itemCount={4}
        showAvatar={true}
        showButton={true}
      />
    );
  }

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            <TeamOutlined style={{ marginRight: 8 }} />
            Connect & Chat
          </span>
          <CustomButton
            size="small"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Refresh
          </CustomButton>
        </div>
      }
    >
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#fff2f0",
            border: "1px solid #ffccc7",
            borderRadius: 6,
          }}
        >
          <Text type="danger">{error}</Text>
        </div>
      )}

      {/* Online Now */}
      {onlineUsers.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Online Now ({onlineUsers.length})</Title>
          <Row gutter={[16, 16]}>
            {onlineUsers.map((user) => (
              <Col xs={12} sm={6} key={user.userId}>
                <Card size="small" style={{ textAlign: "center" }}>
                  <Avatar
                    size={48}
                    src={user.avatar || null}
                    icon={<UserOutlined />}
                    style={{ marginBottom: 8 }}
                  />
                  <div>
                    <Text strong style={{ display: "block" }}>
                      {user.name}
                    </Text>
                    <Tag color="green">
                      <CheckCircleOutlined /> Online
                    </Tag>
                  </div>
                  <Space style={{ marginTop: 8 }}>
                    {user.chated && user.roomId && (
                      <CustomButton
                        size="small"
                        type="primary"
                        onClick={() =>
                          handleChatClick(user.userId, user.roomId)
                        }
                      >
                        Chat
                      </CustomButton>
                    )}
                    {(!user.chated || !user.roomId) && (
                      <CustomButton size="small">Invite</CustomButton>
                    )}
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* Offline Users */}
      {offlineUsers.length > 0 && (
        <>
          {onlineUsers.length > 0 && <Divider />}
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>Other Users ({offlineUsers.length})</Title>
            <Row gutter={[16, 16]}>
              {offlineUsers.map((user) => (
                <Col xs={12} sm={6} key={user.userId}>
                  <Card size="small" style={{ textAlign: "center" }}>
                    <Avatar
                      size={48}
                      src={user.avatar || null}
                      icon={<UserOutlined />}
                      style={{ marginBottom: 8 }}
                    />
                    <div>
                      <Text strong style={{ display: "block" }}>
                        {user.name}
                      </Text>
                      <Tag color="default">
                        <ClockCircleOutlined /> Offline
                      </Tag>
                    </div>
                    <Space style={{ marginTop: 8 }}>
                      {user.chated && user.roomId && (
                        <CustomButton
                          size="small"
                          type="primary"
                          onClick={() =>
                            handleChatClick(user.userId, user.roomId)
                          }
                        >
                          Chat
                        </CustomButton>
                      )}
                      {(!user.chated || !user.roomId) && (
                        <CustomButton size="small">Invite</CustomButton>
                      )}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </>
      )}

      {/* Connection Requests */}
      {connectionRequests.length > 0 && (
        <>
          <Divider />
          <div>
            <Title level={4}>
              <LinkOutlined /> Connection Requests ({connectionRequests.length})
            </Title>
            {connectionRequests.map((request) => (
              <Card
                key={request.id}
                size="small"
                style={{ marginBottom: 16, border: "1px solid #e8e8e8" }}
                styles={{ body: { padding: "16px" } }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <Avatar
                        size={32}
                        icon={<UserOutlined />}
                        style={{ marginRight: 12 }}
                      />
                      <div>
                        <Text strong>{request.name}</Text>
                        {request.type === "connection" && (
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: "12px" }}
                          >
                            {request.team} • {request.mutualConnections} mutual
                            connections
                          </Text>
                        )}
                        {request.type === "meeting" && (
                          <Text
                            type="secondary"
                            style={{ display: "block", fontSize: "12px" }}
                          >
                            &quot;{request.meetingTitle}&quot; •{" "}
                            {request.meetingTime}
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>
                  <Space>
                    <CustomButton
                      type="primary"
                      size="small"
                      onClick={onAcceptRequest}
                    >
                      Accept
                    </CustomButton>
                    <CustomButton size="small" onClick={onDeclineRequest}>
                      Decline
                    </CustomButton>
                    <CustomButton size="small">Chat</CustomButton>
                    {request.type === "connection" && (
                      <CustomButton size="small">View Profile</CustomButton>
                    )}
                    {request.type === "meeting" && (
                      <CustomButton size="small">Propose New Time</CustomButton>
                    )}
                  </Space>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
