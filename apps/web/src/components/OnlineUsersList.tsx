import React, { memo, useMemo } from "react";
import { Avatar, List, Typography, Space, Tag } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useChatStore } from "@web/store/chat.store";
import { useUserStore } from "@web/store/user.store";
import { filterOnlineUsersExcludingCurrent } from "@web/utils/online-users.utils";

const { Text } = Typography;

const OnlineUsersList: React.FC = memo(() => {
  const { allOnline } = useChatStore();
  const { currentUser } = useUserStore();

  // Lọc ra những user online (không bao gồm current user)
  const onlineUsersList = useMemo(() => {
    const filtered = filterOnlineUsersExcludingCurrent(
      allOnline,
      currentUser?._id
    );
    return filtered;
  }, [allOnline, currentUser]);

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
                  src={user.avatarURL || null}
                  icon={<UserOutlined />}
                />
              }
              title={
                <Space>
                  <Text strong>{user.name}</Text>
                  <Tag color="green">Online</Tag>
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
