'use client';

import React from 'react';
import { Modal, Input, List, Avatar, Button, Typography, Space, Checkbox } from 'antd';
import { UserOutlined, UserAddOutlined } from '@ant-design/icons';

const { Search } = Input;
const { Text } = Typography;

interface AddMemberModalProps {
  open: boolean;
  onCancel: () => void;
  onAddMembers: (userIds: string[]) => void;
  currentMembers: string[];
}

export default function AddMemberModal({ open, onCancel, onAddMembers, currentMembers }: AddMemberModalProps) {
  // Đã xoá toàn bộ logic, chỉ giữ lại UI
  return (
    <Modal
      title={
        <Space>
          <UserAddOutlined />
          <span>Thêm thành viên</span>
        </Space>
      }
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Huỷ
        </Button>,
        <Button
          key="add"
          type="primary"
          disabled
          onClick={() => onAddMembers([])}
        >
          Thêm
        </Button>
      ]}
      width={500}
    >
      <div style={{ marginBottom: '16px' }}>
        <Search
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={''}
          onChange={() => {}}
          allowClear
        />
      </div>
      <div style={{ 
        maxHeight: '400px', 
        overflowY: 'auto',
        border: '1px solid #f0f0f0',
        borderRadius: '6px'
      }}>
        <div style={{
          padding: '40px 16px',
          textAlign: 'center',
          color: '#999'
        }}>
          Không có người dùng nào để thêm
        </div>
      </div>
    </Modal>
  );
} 