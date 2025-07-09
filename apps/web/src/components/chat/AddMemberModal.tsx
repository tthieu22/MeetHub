'use client';

import React, { useState } from 'react';
import { Modal, Input, List, Avatar, Button, Typography, Space, Checkbox } from 'antd';
import { UserOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

interface AddMemberModalProps {
  open: boolean;
  onCancel: () => void;
  onAddMembers: (userIds: string[]) => void;
  currentMembers: string[];
}

// Mock data cho danh sách user có thể thêm
const mockAvailableUsers: User[] = [
  { id: 'user5', name: 'Phạm Thị D', email: 'pham.d@example.com', isOnline: true },
  { id: 'user6', name: 'Hoàng Văn E', email: 'hoang.e@example.com', isOnline: false },
  { id: 'user7', name: 'Ngô Thị F', email: 'ngo.f@example.com', isOnline: true },
  { id: 'user8', name: 'Đỗ Văn G', email: 'do.g@example.com', isOnline: true },
  { id: 'user9', name: 'Vũ Thị H', email: 'vu.h@example.com', isOnline: false },
  { id: 'user10', name: 'Lý Văn I', email: 'ly.i@example.com', isOnline: true },
];

export default function AddMemberModal({ 
  open, 
  onCancel, 
  onAddMembers, 
  currentMembers 
}: AddMemberModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Lọc user không có trong phòng hiện tại
  const availableUsers = mockAvailableUsers.filter(
    user => !currentMembers.includes(user.id)
  );

  // Lọc user theo search term
  const filteredUsers = availableUsers.filter(
    user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    setLoading(true);
    try {
      // TODO: Implement API call to add members
      console.log('Adding members:', selectedUsers);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API delay
      onAddMembers(selectedUsers);
      setSelectedUsers([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedUsers([]);
    setSearchTerm('');
    onCancel();
  };

  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          <span>Thêm thành viên</span>
        </Space>
      }
      open={open}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Hủy
        </Button>,
        <Button
          key="add"
          type="primary"
          loading={loading}
          disabled={selectedUsers.length === 0}
          onClick={handleAddMembers}
        >
          Thêm {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ''}
        </Button>
      ]}
      width={500}
    >
      <div style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          prefix={<SearchOutlined />}
          allowClear
        />
      </div>

      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #f0f0f0',
        borderRadius: '6px'
      }}>
        {filteredUsers.length > 0 ? (
          <List
            dataSource={filteredUsers}
            renderItem={(user) => (
              <List.Item
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const isSelected = selectedUsers.includes(user.id);
                  handleUserSelect(user.id, !isSelected);
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      icon={<UserOutlined />}
                      src={user.avatar}
                      style={{
                        border: user.isOnline ? '2px solid #52c41a' : '2px solid #bfbfbf'
                      }}
                    />
                  }
                  title={
                    <Space>
                      <Text strong>{user.name}</Text>
                      {user.isOnline && (
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          ● Online
                        </Text>
                      )}
                    </Space>
                  }
                  description={
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {user.email}
                    </Text>
                  }
                />
                <Checkbox
                  checked={selectedUsers.includes(user.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleUserSelect(user.id, e.target.checked);
                  }}
                />
              </List.Item>
            )}
          />
        ) : (
          <div style={{
            padding: '40px 16px',
            textAlign: 'center',
            color: '#999'
          }}>
            {searchTerm ? 'Không tìm thấy người dùng phù hợp' : 'Không có người dùng nào để thêm'}
          </div>
        )}
      </div>

      {selectedUsers.length > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#f6ffed',
          border: '1px solid #b7eb8f',
          borderRadius: '6px'
        }}>
          <Text>
            Đã chọn <Text strong>{selectedUsers.length}</Text> thành viên
          </Text>
        </div>
      )}
    </Modal>
  );
} 