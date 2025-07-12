import React, { memo, useMemo } from "react";
import { Avatar, List, Typography, Space, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";

const { Text } = Typography;

interface OnlineUser {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

const OnlineUsersList: React.FC = memo(() => {
  const { rooms, onlineUsers } = useChatStore();
  const { currentUser } = useUserStore();

  // Tạo danh sách tất cả users từ các phòng
  const allUsers = useMemo(() => {
    const userMap = new Map<string, OnlineUser>();

    rooms.forEach((room) => {
      if (Array.isArray(room.members)) {
        room.members.forEach((member) => {
          if (member.userId !== currentUser?._id) {
            userMap.set(member.userId, {
              userId: member.userId,
              name: member.name || member.email || "Unknown",
              email: member.email || "",
              avatar: member?.avatar || "",
              isOnline: onlineUsers[member.userId] || false,
            });
          }
        });
      }
    });

    return Array.from(userMap.values());
  }, [rooms, onlineUsers, currentUser]);

  // Lọc ra những user online
  const onlineUsersList = useMemo(() => {
    return allUsers.filter((user) => user.isOnline);
  }, [allUsers]);

  if (onlineUsersList.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <Text type="secondary">Không có ai online</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "12px" }}>
        <Text strong>Người online ({onlineUsersList.length})</Text>
      </div>
      <List
        size="small"
        dataSource={onlineUsersList}
        renderItem={(user) => (
          <List.Item style={{ padding: "8px 0" }}>
            <List.Item.Meta
              avatar={
                <Avatar
                  size={32}
                  src={user.avatar || null}
                  icon={<UserOutlined />}
                />
              }
              title={
                <Space>
                  <Text strong>{user.name}</Text>
                  <Tag color="green">
                    Online
                  </Tag>
                </Space>
              }
              description={
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {user.email}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
});

OnlineUsersList.displayName = "OnlineUsersList";

export default OnlineUsersList; 