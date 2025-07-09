'use client';

import React, { useState } from 'react';
import { Avatar, Typography, Space, Button, Popover, Modal, List, Badge, Tooltip } from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  VideoCameraOutlined, 
  MoreOutlined,
  TeamOutlined,
  SettingOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import AddMemberModal from './AddMemberModal';

const { Title, Text } = Typography;

// Mock data cho thành viên
const mockMembers = [
  { id: '1', name: 'Nguyễn Văn A', avatar: null, role: 'admin', isOnline: true },
  { id: '2', name: 'Trần Thị B', avatar: null, role: 'member', isOnline: true },
  { id: '3', name: 'Lê Văn C', avatar: null, role: 'member', isOnline: false },
  { id: '4', name: 'Phạm Thị D', avatar: null, role: 'member', isOnline: true },
];

interface ChatHeaderProps {
  roomName?: string;
  roomId?: string;
}

export default function ChatHeader({ roomName = 'Phòng chat mẫu', roomId }: ChatHeaderProps) {
  const [isMembersModalVisible, setIsMembersModalVisible] = useState(false);
  const [isRoomInfoModalVisible, setIsRoomInfoModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);

  const currentMemberIds = mockMembers.map(m => m.id);

  const handleAddMembers = (userIds: string[]) => {
    console.log('Added members:', userIds);
    // TODO: Implement actual member addition
    setIsAddMemberModalVisible(false);
  };

  const handleMenuClick = (key: string) => {
    setIsMoreMenuVisible(false);
    switch (key) {
      case 'members':
        setIsMembersModalVisible(true);
        break;
      case 'room-info':
        setIsRoomInfoModalVisible(true);
        break;
      case 'settings':
        console.log('Cài đặt phòng');
        break;
      case 'add-member':
        setIsAddMemberModalVisible(true);
        break;
      case 'remove-member':
        console.log('Xóa thành viên');
        break;
    }
  };

  // Menu content cho Popover
  const moreMenuContent = (
    <div style={{ minWidth: '150px' }}>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
        onClick={() => handleMenuClick('members')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <TeamOutlined />
        Xem thành viên
      </div>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
        onClick={() => handleMenuClick('room-info')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <InfoCircleOutlined />
        Thông tin phòng
      </div>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
        onClick={() => handleMenuClick('settings')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <SettingOutlined />
        Cài đặt phòng
      </div>
      <div style={{ 
        height: '1px', 
        backgroundColor: '#f0f0f0', 
        margin: '4px 0' 
      }} />
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
        onClick={() => handleMenuClick('add-member')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <UserAddOutlined />
        Thêm thành viên
      </div>
      <div
        style={{
          padding: '8px 12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px'
        }}
        onClick={() => handleMenuClick('remove-member')}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <UserDeleteOutlined />
        Xóa thành viên
      </div>
    </div>
  );

  return (
    <>
      <div style={{ 
        padding: '16px', 
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        backgroundColor: '#fff'
      }}>
        <Space>
          <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
            <Avatar 
              icon={<UserOutlined />}
              size="large"
              style={{
                border: '2px solid #bfbfbf'
              }}
            />
          </div>
          <div style={{ flexShrink: 0 }}>
            <Title level={5} style={{ margin: 0, fontSize: '16px' }}>{roomName}</Title>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {mockMembers.filter(m => m.isOnline).length} thành viên online
            </Text>
          </div>
        </Space>
        
        <Space style={{ flexShrink: 0 }}>
          <Tooltip title="Gọi thoại">
            <Button 
              type="text" 
              icon={<PhoneOutlined />}
              size="large"
            />
          </Tooltip>
          <Tooltip title="Gọi video">
            <Button 
              type="text" 
              icon={<VideoCameraOutlined />}
              size="large"
            />
          </Tooltip>
          <Popover
            content={moreMenuContent}
            placement="bottomRight"
            trigger="click"
            open={isMoreMenuVisible}
            onOpenChange={setIsMoreMenuVisible}
          >
            <Button 
              type="text" 
              icon={<MoreOutlined />}
              size="large"
            />
          </Popover>
        </Space>
      </div>

      {/* Modal Xem thành viên */}
      <Modal
        title="Thành viên phòng chat"
        open={isMembersModalVisible}
        onCancel={() => setIsMembersModalVisible(false)}
        footer={null}
        width={400}
      >
        <List
          dataSource={mockMembers}
          renderItem={(member) => (
            <List.Item
              actions={[
                member.role === 'admin' && (
                  <Badge key="admin" status="processing" text="Admin" />
                ),
                <Button 
                  key="delete"
                  type="text" 
                  size="small" 
                  icon={<UserDeleteOutlined />}
                  onClick={() => console.log('Xóa thành viên:', member.id)}
                  disabled={member.role === 'admin'}
                />
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Badge 
                    status={member.isOnline ? 'success' : 'default'} 
                    dot
                  >
                    <Avatar icon={<UserOutlined />} />
                  </Badge>
                }
                title={
                  <Space>
                    <Text strong>{member.name}</Text>
                    {member.isOnline && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        ● Online
                      </Text>
                    )}
                  </Space>
                }
                description={
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {member.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Modal Thông tin phòng */}
      <Modal
        title="Thông tin phòng chat"
        open={isRoomInfoModalVisible}
        onCancel={() => setIsRoomInfoModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ padding: '16px 0' }}>
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Tên phòng:</Text>
            <div style={{ marginTop: '4px' }}>
              <Text>{roomName}</Text>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>ID phòng:</Text>
            <div style={{ marginTop: '4px' }}>
              <Text code>{roomId}</Text>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Thành viên:</Text>
            <div style={{ marginTop: '4px' }}>
              <Text>{mockMembers.length} thành viên</Text>
            </div>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Text strong>Ngày tạo:</Text>
            <div style={{ marginTop: '4px' }}>
              <Text>{new Date().toLocaleDateString('vi-VN')}</Text>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Thêm thành viên */}
      <AddMemberModal
        open={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onAddMembers={handleAddMembers}
        currentMembers={currentMemberIds}
      />
    </>
  );
} 