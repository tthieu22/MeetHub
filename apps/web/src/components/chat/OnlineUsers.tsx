'use client';

import React from 'react';
import { Avatar, List, Typography, Badge, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useOnlineStatus } from '@web/hooks/useOnlineStatus';

const { Text } = Typography;

interface OnlineUsersProps {
  roomId?: string;
  members?: Array<{
    userId: string;
    name: string;
    email?: string;
    avatarURL?: string;
  }>;
}

export default function OnlineUsers({ roomId, members }: OnlineUsersProps) {
  const { onlineUsers, isOnline } = useOnlineStatus(roomId);

  if (!members || members.length === 0) {
    return (
      <div style={{ padding: '8px 16px' }}>
        <Text type="secondary">Không có thành viên</Text>
      </div>
    );
  }

  // Loại bỏ duplicates dựa trên userId
  const uniqueMembers = members.filter((member, index, self) => 
    index === self.findIndex(m => m.userId === member.userId)
  );

  const onlineMembers = uniqueMembers.filter(member => isOnline(member.userId));
  const offlineMembers = uniqueMembers.filter(member => !isOnline(member.userId));

  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <Text strong>Thành viên ({uniqueMembers.length})</Text>
        <div style={{ marginTop: '4px' }}>
          <Tag color="green">Online: {onlineMembers.length}</Tag>
          <Tag color="default">Offline: {offlineMembers.length}</Tag>
        </div>
      </div>

      {/* Online Members */}
      {onlineMembers.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <Text type="success" style={{ fontSize: '12px', fontWeight: 500 }}>
            Online ({onlineMembers.length})
          </Text>
          <List
            size="small"
            dataSource={onlineMembers}
            renderItem={(member) => (
              <List.Item style={{ padding: '4px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Badge status="success" dot>
                      <Avatar size="small" src={member.avatarURL} icon={<UserOutlined />} />
                    </Badge>
                  }
                  title={
                    <Text style={{ fontSize: '12px', color: '#52c41a' }}>
                      {member.name}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Offline Members */}
      {offlineMembers.length > 0 && (
        <div>
          <Text type="secondary" style={{ fontSize: '12px', fontWeight: 500 }}>
            Offline ({offlineMembers.length})
          </Text>
          <List
            size="small"
            dataSource={offlineMembers}
            renderItem={(member) => (
              <List.Item style={{ padding: '4px 0' }}>
                <List.Item.Meta
                  avatar={
                    <Avatar size="small" src={member.avatarURL} icon={<UserOutlined />} />
                  }
                  title={
                    <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      {member.name}
                    </Text>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      )}
    </div>
  );
} 