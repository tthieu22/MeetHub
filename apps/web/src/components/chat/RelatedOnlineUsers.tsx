import React from 'react';
import { Avatar, List, Typography, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Dữ liệu mẫu cho giao diện
const mockOnlineUsers = [
  { id: '1', name: 'Nguyễn Văn A' },
  { id: '2', name: 'Trần Thị B' },
  { id: '3', name: 'Lê Văn C' }
];

const RelatedOnlineUsers: React.FC = () => {
  return (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ marginBottom: '8px' }}>
        <Text strong>Người dùng online có quan hệ ({mockOnlineUsers.length})</Text>
      </div>
      <List
        size="small"
        dataSource={mockOnlineUsers}
        renderItem={(user) => (
          <List.Item style={{ padding: '4px 0' }}>
            <List.Item.Meta
              avatar={
                <Badge status="success" dot>
                  <Avatar size="small" icon={<UserOutlined />} />
                </Badge>
              }
              title={
                <Text style={{ fontSize: '12px' }}>
                  {user.name}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );
};

export default RelatedOnlineUsers; 