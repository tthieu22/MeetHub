import React, { useState } from 'react';
import { Modal, Input, notification } from 'antd';
import type { NotificationInstance } from 'antd/es/notification/interface';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  username?: string;
}

interface CreateGroupChatModalProps {
  visible: boolean;
  onClose: () => void;
  members: User[];
  currentUser: User;
  onSuccess: (groupName: string, memberIds: string[]) => void;
  setApiInstance?: (api: NotificationInstance) => void;
  bookingTitle?: string;
}

const CreateGroupChatModal: React.FC<CreateGroupChatModalProps> = ({
  visible,
  onClose,
  members,
  currentUser,
  onSuccess,
  setApiInstance,
  bookingTitle
}) => {
  // Loại bỏ trùng lặp ID giữa currentUser và members
  const uniqueMemberIds = Array.from(new Set([currentUser._id, ...members.map(m => m._id)]));
  const memberCount = uniqueMemberIds.length;
  const [groupName, setGroupName] = useState<string>(
    `Group Meeting: ${bookingTitle ? bookingTitle + ' ' : ''} - ${currentUser.name || currentUser.username || currentUser.email} (${memberCount} member${memberCount > 1 ? 's' : ''})`
  );
  // const [creating, setCreating] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  React.useEffect(() => {
    if (setApiInstance) setApiInstance(api);
  }, [api, setApiInstance]);

  // Khi xác nhận tạo nhóm chat
  const handleCreateGroup = async () => {
    if (!groupName.trim() || members.length < 2) {
      api.error({
        message: 'Vui lòng nhập tên nhóm và chọn đủ thành viên!',
        placement: 'topRight',
      });
      return;
    }
    const memberIds = [currentUser._id, ...members.map(m => m._id).filter(id => id !== currentUser._id)];
    onSuccess(groupName.trim(), memberIds);
    onClose();
  };

  // Khi đóng modal, reset tên nhóm
  const handleClose = () => {
    // Đếm lại số thành viên khi đóng
    const uniqueMemberIds = Array.from(new Set([currentUser._id, ...members.map(m => m._id)]));
    const memberCount = uniqueMemberIds.length;
    setGroupName(
      `Group Meeting: ${bookingTitle ? bookingTitle + ' ' : ''} - ${currentUser.name || currentUser.username || currentUser.email} (${memberCount} member${memberCount > 1 ? 's' : ''})`
    );
    onClose();
  };

  return (
    <>
      {contextHolder}
      <Modal
        open={visible}
        onCancel={handleClose}
        onOk={handleCreateGroup}
        confirmLoading={false}
        title="Xác nhận tạo nhóm chat"
        okText="Tạo nhóm"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 12 }}>
          <b>Tên nhóm:</b>
          <Input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <b>Thành viên nhóm:</b>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {currentUser && (
              <li key={currentUser._id}>{currentUser.name} (Bạn)</li>
            )}
            {members
              .filter(m => m._id !== currentUser._id)
              .map(m => (
                <li key={m._id}>{m.name} ({m.email})</li>
              ))}
          </ul>
        </div>
      </Modal>
    </>
  );
};

export default CreateGroupChatModal; 