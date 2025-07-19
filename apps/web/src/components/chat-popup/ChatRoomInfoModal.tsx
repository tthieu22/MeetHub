import React, { useEffect, useState } from "react";
import { Modal, Descriptions, Avatar, Tag, Spin, Typography, Space, Divider } from "antd";
import { UserOutlined, CalendarOutlined, TeamOutlined } from "@ant-design/icons";
import { roomChatApiService } from "@web/services/api/room.chat.api";
import type { LastMessageInfo } from "@web/types/chat";

const { Text, Title } = Typography;

interface ChatRoomInfoModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  currentUserId?: string;
}

interface RoomInfo {
  _id: string;
  roomId: string;
  name: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  isGroup: boolean;
  isActive: boolean;
  isDeleted: boolean;
  members: Array<{
    userId: string;
    name: string;
    email: string;
    avatarURL: string;
    role: string;
    isOnline: boolean;
    joinedAt: string;
  }>;
  memberCount: number;
  lastMessage?: LastMessageInfo | null;
  unreadCount: number;
  totalMessages: number;
  userRole: string | null;
  onlineMemberIds: string[];
  onlineCount: number;
}

export default function ChatRoomInfoModal({
  open,
  onClose,
  conversationId,
  currentUserId,
}: ChatRoomInfoModalProps) {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [members, setMembers] = useState<Array<{
    userId: string;
    name: string;
    email: string;
    avatarURL: string;
    role: string;
    isOnline: boolean;
    joinedAt: string;
  }>>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Lấy thông tin phòng và thành viên
  useEffect(() => {
    if (!open || !conversationId) return;

    const fetchRoomInfo = async () => {
      setLoading(true);
      try {
        // Lấy thông tin chi tiết phòng
        const roomData = await roomChatApiService.getRoom(conversationId);
        setRoomInfo(roomData);

        // Sử dụng thông tin thành viên từ roomData
        if (roomData.members) {
          setMembers(roomData.members);
        }

        // Sử dụng vai trò từ roomData
        setUserRole(roomData.userRole);
      } catch (error) {
        console.error("Lỗi khi lấy thông tin phòng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomInfo();
  }, [open, conversationId]);

  const getRoomTypeText = (type: string) => {
    switch (type) {
      case 'private':
        return 'Tin nhắn riêng tư';
      case 'group':
        return 'Nhóm chat';
      case 'support':
        return 'Hỗ trợ';
      default:
        return 'Không xác định';
    }
  };

  const getRoleText = (role: string | null) => {
    switch (role) {
      case 'admin':
        return 'Quản trị viên';
      case 'member':
        return 'Thành viên';
      default:
        return 'Không xác định';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          <span>Thông tin phòng chat</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Đang tải thông tin phòng...</Text>
          </div>
        </div>
      ) : roomInfo ? (
        <div>
          {/* Thông tin cơ bản */}
          <Descriptions title="Thông tin cơ bản" bordered column={1}>
            <Descriptions.Item label="Tên phòng">
              <Title level={5} style={{ margin: 0 }}>
                {roomInfo.name}
              </Title>
            </Descriptions.Item>
            <Descriptions.Item label="Loại phòng">
              <Tag color={roomInfo.type === 'group' ? 'blue' : 'green'}>
                {getRoomTypeText(roomInfo.type)}
              </Tag>
            </Descriptions.Item>
            {roomInfo.description && (
              <Descriptions.Item label="Mô tả">
                <Text>{roomInfo.description}</Text>
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Số thành viên">
              <Space>
                <UserOutlined />
                <Text>{members.length} người</Text>
              </Space>
            </Descriptions.Item>
            {userRole && (
              <Descriptions.Item label="Vai trò của bạn">
                <Tag color={userRole === 'admin' ? 'red' : 'default'}>
                  {getRoleText(userRole)}
                </Tag>
              </Descriptions.Item>
            )}
          </Descriptions>

          <Divider />

          {/* Thông tin thời gian */}
          <Descriptions title="Thông tin thời gian" bordered column={1}>
            <Descriptions.Item label="Ngày tạo">
              <Space>
                <CalendarOutlined />
                <Text>{formatDate(roomInfo.createdAt)}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Cập nhật lần cuối">
              <Space>
                <CalendarOutlined />
                <Text>{formatDate(roomInfo.updatedAt)}</Text>
              </Space>
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          {/* Danh sách thành viên */}
          <div>
            <Title level={5}>
              <Space>
                <UserOutlined />
                <span>Danh sách thành viên ({members.length})</span>
              </Space>
            </Title>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {members.map((member, index) => (
                <div
                  key={member.userId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < members.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <Avatar
                    src={member.avatarURL}
                    icon={<UserOutlined />}
                    style={{ marginRight: 12 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>
                      {member.name || member.email}
                      {member.userId === currentUserId && (
                        <Tag style={{ marginLeft: 8 }}>
                          Bạn
                        </Tag>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {member.email}
                    </div>
                  </div>
                  {member.role && (
                    <Tag color={member.role === 'admin' ? 'red' : 'default'}>
                      {getRoleText(member.role)}
                    </Tag>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text type="secondary">Không thể tải thông tin phòng</Text>
        </div>
      )}
    </Modal>
  );
} 