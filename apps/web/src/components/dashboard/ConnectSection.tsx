"use client";

import React, { useEffect, useState } from "react";
import { Typography, Card, Space, Avatar, Tag, Row, Col, Divider } from "antd";
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  LinkOutlined,
} from "@ant-design/icons";

import { useChatStore } from "@web/store/chat.store";
import { useWebSocketStore } from "@web/store/websocket.store";
import { WS_EVENTS } from "@web/constants/websocket.events";
import CustomButton from "@web/components/CustomButton";
import LoadingCard from "./LoadingCard";

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

export default function ConnectSection({
  connectionRequests,
  onAcceptRequest,
  onDeclineRequest,
}: ConnectSectionProps) {
  const allOnline = useChatStore((s) => s.allOnline);
  const rooms = useChatStore((s) => s.rooms);
  const { isConnected, socket } = useWebSocketStore();
  const [loading, setLoading] = useState(true);

  // Load rooms và allOnline users khi component mount
  useEffect(() => {
    if (isConnected && socket) {
      if (rooms.length === 0) {
        socket.emit(WS_EVENTS.GET_ROOMS);
      }
      socket.emit("get_all_online_users");
    }
  }, [isConnected, socket, rooms.length]);

  // Simulate loading time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Lọc chỉ những user đang online từ allOnline
  let onlineMembers = allOnline.filter((user) => user.isOnline);

  // Fallback: nếu allOnline rỗng, lấy từ rooms
  if (onlineMembers.length === 0 && rooms.length > 0) {
    const allMembers = rooms.flatMap(
      (room) =>
        room.members?.map((member) => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          avatarURL: member.avatarURL,
          isOnline: room.onlineMemberIds?.includes(member.userId) || false,
        })) || []
    );

    // Loại bỏ duplicates và lọc online
    const uniqueMembers = allMembers.filter(
      (member, index, self) =>
        index === self.findIndex((m) => m.userId === member.userId)
    );

    onlineMembers = uniqueMembers.filter((member) => member.isOnline);
  }

  // Debug: log để kiểm tra dữ liệu
  console.log("ConnectSection Debug:", {
    allOnline: allOnline.length,
    rooms: rooms.length,
    onlineMembers: onlineMembers.length,
    onlineMembersData: onlineMembers,
  });

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
        <span>
          <TeamOutlined style={{ marginRight: 8 }} />
          Connect & Chat
        </span>
      }
    >
      {/* Online Now */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Online Now ({onlineMembers.length})</Title>
        <Row gutter={[16, 16]}>
          {onlineMembers.map((user) => (
            <Col xs={12} sm={6} key={user.userId}>
              <Card size="small" style={{ textAlign: "center" }}>
                <Avatar
                  size={48}
                  src={user.avatarURL || null}
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
                  <CustomButton size="small" type="primary">
                    Chat
                  </CustomButton>
                  <CustomButton size="small">Invite</CustomButton>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Divider />

      {/* Connection Requests */}
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
    </Card>
  );
}
