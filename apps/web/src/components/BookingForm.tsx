'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Form, 
  Input, 
  DatePicker, 
  TimePicker, 
  Select, 
  Row, 
  Col, 
  Typography,
  Tag,
  Button,
  Spin,
  message,
  Alert, 
} from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { api } from '@web/lib/api';
import { useUserStore } from '@web/store/user.store';
import moment, { Moment } from 'moment';
import CreateGroupChatModal from './CreateGroupChatModal';
import dayjs, { Dayjs } from 'dayjs';
import { roomChatApiService } from '@web/services/api/room.chat.api';
import { useWebSocket } from '@web/hooks/useWebSocket';
const { TextArea } = Input;
const { Text } = Typography;
import ModalCustom from '../components/ModalCustom';

interface Booking {
  _id: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  title?: string;
}

interface BookingFormProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (formData: Record<string, unknown>) => Promise<void>; // Kiểu dữ liệu rõ ràng
  initialValues: Record<string, unknown>;
  bookings: Booking[];
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  errors?: { field?: string; message: string }[];
}

interface Conflict {
  title: string;
  startTime: string;
  endTime: string;
}

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const BookingForm: React.FC<BookingFormProps> = ({ 
  visible, 
  onCancel, 
  onSubmit, 
  initialValues,
  bookings
}) => {
  const [form] = Form.useForm();
  const [users, setUsers] = useState<User[]>([]);
  const [isEditingName, setIsEditingName] = useState(false);
  // Lấy user hiện tại từ store (không gọi API nữa)
  const currentUser = useUserStore((state) => state.currentUser);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [apiErrors, setApiErrors] = useState<{ field?: string; message: string }[] | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [createdGroupId, setCreatedGroupId] = useState<string | null>(null); // vẫn giữ để nhận groupId khi tạo
  const [groupChatId, setGroupChatId] = useState<string | null>(null); // biến mới lưu groupId
  const [pendingGroup, setPendingGroup] = useState<{ name: string, members: string[] } | null>(null);
  // Đã xoá groupModalApi, roomId, setRoomId vì không dùng

  // Lấy socket và hàm getRooms từ hook
  const { socket, isConnected } = useWebSocket();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/find-all');
      
      if (response.data?.success && Array.isArray(response.data.data)) {
        const usersArr = response.data.data;
        if (!Array.isArray(usersArr)) {
          setUsers([]);
          return;
        }
        const validUsers = (usersArr as User[])
          .filter((user) => isValidObjectId(user._id))
          .map((user) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive
          }));
        setUsers(validUsers);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch users');
      }
    } catch (error) {
      const err = error as Error;
      console.error('Error fetching users:', err);
      message.error(err.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      const initializeForm = async () => {
        await fetchUsers();
        // Xử lý participants: chỉ filter nếu là mảng
        let filteredParticipants: string[] = [];
        if (Array.isArray(initialValues.participants)) {
          filteredParticipants = initialValues.participants.filter((id: string) => isValidObjectId(id));
        }
        const startDate = initialValues.startTime 
          ? moment(initialValues.startTime) 
          : moment().add(1, 'day').startOf('day');
        const endDate = initialValues.endTime 
          ? moment(initialValues.endTime) 
          : startDate.clone();
        form.setFieldsValue({
          title: initialValues.title || 'Cuộc họp nhóm dự án',
          description: initialValues.description || 'Thảo luận về kế hoạch phát triển sản phẩm mới',
          startDate,
          endDate,
          startTime: startDate.clone().set({ hour: 9, minute: 0 }),
          endTime: endDate.clone().set({ hour: 17, minute: 0 }),
          participants: filteredParticipants,
        });
      };
      initializeForm();
    }
  }, [visible, form, initialValues, fetchUsers, onCancel]);

  useEffect(() => {
    if (createdGroupId) {
      setGroupChatId(createdGroupId); // chỉ lưu groupId vào biến riêng
      setCreatedGroupId(null);
    }
  }, [createdGroupId]);

  const checkBookingConflict = (start: Moment, end: Moment): Conflict[] => {
    const conflicts: Conflict[] = [];
    bookings.forEach((booking) => {
      if (booking.status === 'cancelled') return;
      const existingStart = moment(booking.startTime);
      const existingEnd = moment(booking.endTime);
      if (start.isBefore(existingEnd) && end.isAfter(existingStart)) {
        conflicts.push({
          title: booking.title || 'Không có tiêu đề',
          startTime: existingStart.format('DD/MM/YYYY HH:mm'),
          endTime: existingEnd.format('DD/MM/YYYY HH:mm'),
        });
      }
    });
    return conflicts;
  };

  const createGroupChat = async (groupName: string, memberIds: string[]): Promise<string | undefined> => {
    try {
      const payload = {
        name: groupName.trim(),
        type: 'group',
        members: memberIds,
      };
      const res = await roomChatApiService.createRoom(payload);
      const groupRes = res as { _id?: string; roomId?: string };
      const groupId: string | undefined = groupRes._id || groupRes.roomId;
      if (res && groupId) {
        return groupId;
      }
      return undefined;
    } catch {
      message.error('Tạo nhóm chat thất bại. Vui lòng thử lại.');
      return undefined;
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setApiErrors(null);
      setConflicts([]);
      const values = await form.validateFields();
      console.log('Giá trị form:', values);
      let groupId: string | undefined;
      // Nếu có pendingGroup thì tạo nhóm trước
      if (pendingGroup) {
        groupId = await createGroupChat(pendingGroup.name, pendingGroup.members);
        // Sau khi tạo group chat thành công, emit get_rooms để cập nhật danh sách
        if (groupId && isConnected && socket) {
          socket.emit('get_rooms');
        }
        if (groupId && typeof groupId === 'string') {
          setGroupChatId(groupId); // lưu groupId vào biến riêng (cho lần sau nếu cần)
        } else {
          setSubmitting(false);
          console.log('Tạo group chat thất bại hoặc bị huỷ');
          return;
        }
      }

      const startDateTime = values.startDate.clone()
        .set({
          hour: values.startTime.hour(),
          minute: values.startTime.minute(),
          second: 0
        });
      const endDateTime = values.endDate.clone()
        .set({
          hour: values.endTime.hour(),
          minute: values.endTime.minute(),
          second: 0
        });

      // Validation checks
      if (startDateTime.isBefore(moment())) {
        message.error('Thời gian bắt đầu phải trong tương lai');
        console.log('Thời gian bắt đầu không hợp lệ');
        return;
      }

      if (endDateTime.isBefore(startDateTime)) {
        message.error('Thời gian kết thúc phải sau thời gian bắt đầu');
        console.log('Thời gian kết thúc không hợp lệ');
        return;
      }

      const conflictList = checkBookingConflict(startDateTime, endDateTime);
      if (conflictList.length > 0) {
        setConflicts(conflictList);
        console.log('Bị trùng lịch:', conflictList);
        return;
      }

      if (!currentUser) {
        message.error('Không tìm thấy thông tin người đặt');
        console.log('Thiếu currentUser');
        return;
      }

      const submitData = {
        room: initialValues.room,
        user: currentUser._id,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        title: values.title,
        description: values.description,
        participants: values.participants,
        status: 'pending',
        groupChatId: groupId || groupChatId || undefined // Ưu tiên groupId vừa tạo
      };
      console.log('Dữ liệu gửi lên onSubmit:', submitData);

      try {
        await onSubmit(submitData);
        message.success('Đặt phòng thành công!');
        form.resetFields();
        setPendingGroup(null); // Reset pendingGroup sau khi submit thành công
        setGroupChatId(null); // Reset groupChatId
        onCancel();
      } catch (error) { 
        console.error('Lỗi khi gọi onSubmit:', error);
        const err = error as { response?: { data?: ApiResponse } };
        if (err.response?.data) {
          const responseData: ApiResponse = err.response.data;
          if (responseData.success === false) {
            message.error(responseData.message || 'Đặt phòng thất bại');
            if (responseData.errors && responseData.errors.length > 0) {
              const errorFields = responseData.errors
                .filter((errItem) => !!errItem.field)
                .map((errItem) => ({
                  name: errItem.field!,
                  errors: [errItem.message]
                }));
              form.setFields(errorFields);
              setApiErrors(responseData.errors);
            }
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      const err = error as Error;
      console.error('Booking submission error:', err);
      if (!(err as { response?: unknown }).response) {
        message.error(err.message || 'Đặt phòng thất bại. Vui lòng thử lại.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalCustom
      title="Tạo Đặt Phòng"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={submitting}>
          Hủy
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          loading={submitting}
        >
          Xác nhận
        </Button>,
      ]}
      width={800}
      centered
      destroyOnClose
    >
      {/* Đảm bảo truyền đúng prop form={form} */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <Spin />
        </div>
      ) : (
        <Form form={form} layout="vertical">
          {/* Display conflicts if any */}
          {conflicts.length > 0 && (
            <Alert
              message="Lịch đặt phòng bị trùng"
              description={
                <div>
                  <Text>Khung giờ bạn chọn đã được đặt bởi các lịch sau:</Text>
                  <ul style={{ marginTop: 8, paddingLeft: 20 }}>
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        <Text strong>{conflict.title}</Text>
                        {' '}({conflict.startTime} - {conflict.endTime})
                      </li>
                    ))}
                  </ul>
                  <Text>Vui lòng chọn khung giờ khác.</Text>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}

          {/* Display API errors if any */}
          {apiErrors && (
            <div style={{ marginBottom: 16 }}>
              {apiErrors.map((err, index: number) => (
                <Text key={index} type="danger" style={{ display: 'block' }}>
                  {err.message}
                </Text>
              ))}
            </div>
          )}

          <Form.Item 
            name="title" 
            label="Tiêu đề" 
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input placeholder="Nhập tiêu đề cuộc họp" />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết cuộc họp" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày bắt đầu!' },
                  () => ({
                    validator(_, value) {
                      if (!value || value.isSameOrAfter(moment(), 'day')) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Ngày phải trong tương lai');
                    },
                  }),
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày bắt đầu"
                  disabledDate={(current: Dayjs | null) => current !== null && current.isBefore(dayjs(), 'day')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="startTime"
                label="Giờ bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn giờ bắt đầu!' }]}
              >
                <TimePicker 
                  format="HH:mm" 
                  minuteStep={15}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="endDate"
                label="Ngày kết thúc"
                rules={[
                  { required: true, message: 'Vui lòng chọn ngày kết thúc!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      if (!value || !startDate || value.isSameOrAfter(startDate, 'day')) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Ngày kết thúc phải từ ngày bắt đầu trở đi');
                    },
                  }),
                ]}
              >
                <DatePicker 
                  format="DD/MM/YYYY"
                  style={{ width: '100%' }}
                  placeholder="Chọn ngày kết thúc"
                  disabledDate={(current: Dayjs | null) => {
                    const startDate = form.getFieldValue('startDate');
                    return current !== null && current.isBefore(dayjs(startDate) || dayjs(), 'day');
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="endTime"
                label="Giờ kết thúc"
                rules={[
                  { required: true, message: 'Vui lòng chọn giờ kết thúc!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const startDate = getFieldValue('startDate');
                      const endDate = getFieldValue('endDate');
                      const startTime = getFieldValue('startTime');
                      
                      if (startDate?.isSame(endDate, 'day') && 
                          value?.isBefore(startTime)) {
                        return Promise.reject('Giờ kết thúc phải sau giờ bắt đầu');
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <TimePicker 
                  format="HH:mm" 
                  minuteStep={15}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="participants" label="Người tham gia">
            <Select 
              mode="multiple" 
              allowClear
              placeholder="Chọn người tham gia"
              options={users.map(user => ({
                value: user._id,
                label: user.name
              }))}
              optionFilterProp="label"
              filterOption={(input, option) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={val => {
                form.setFieldsValue({ participants: val });
                // Hiển thị nút tạo nhóm nếu chọn >=2
                if (val.length >= 2) {
                  setGroupMembers(users.filter(u => val.includes(u._id)));
                  // Nếu pendingGroup đã có nhưng members khác thì huỷ
                  if (pendingGroup && (
                    pendingGroup.members.length !== val.length ||
                    !pendingGroup.members.every(id => val.includes(id))
                  )) {
                    setPendingGroup(null);
                  }
                } else {
                  setGroupMembers([]);
                  if (pendingGroup) setPendingGroup(null);
                }
              }}
            />
          </Form.Item>
          {pendingGroup && (
            <div style={{ marginBottom: 16, padding: 12, border: '1px solid #e6f7ff', borderRadius: 6, background: '#f6ffed' }}>
              <b>Thông tin đoạn chat sẽ tạo:</b>
              <div>
                <span><b>Tên đoạn chat:</b> </span>
                {isEditingName ? (
                  <Input
                    style={{ width: 'auto', display: 'inline-block', maxWidth: '300px' }}
                    defaultValue={pendingGroup.name}
                    onBlur={(e) => {
                      if (pendingGroup && e.target.value) {
                        setPendingGroup({ ...pendingGroup, name: e.target.value });
                      }
                      setIsEditingName(false);
                    }}
                    onPressEnter={(e) => {
                      if (pendingGroup && (e.target as HTMLInputElement).value) {
                        setPendingGroup({ ...pendingGroup, name: (e.target as HTMLInputElement).value });
                      }
                      setIsEditingName(false);
                    }}
                    autoFocus
                  />
                ) : (
                  <span onClick={() => setIsEditingName(true)} style={{ cursor: 'pointer', borderBottom: '1px dashed #ccc', paddingBottom: '2px' }}>
                    {pendingGroup.name} <EditOutlined style={{ marginLeft: 4, color: '#888' }} />
                  </span>
                )}
              </div>
              <div>
                <b>Thành viên:</b> {users.filter(u => pendingGroup.members.includes(u._id)).map(u => u.name).join(', ')}
              </div>
              <div style={{ marginTop: 8 }}>
                <Button danger size="small" onClick={() => { setPendingGroup(null); setGroupMembers([]); }}>
                  Huỷ tạo nhóm
                </Button>
              </div>
            </div>
          )}
          {groupMembers.length >= 2 && currentUser && !pendingGroup && (
            <Button
              style={{ marginBottom: 16 }}
              onClick={() => setIsGroupModalOpen(true)}
            >
              Tạo nhóm chat cho những người tham gia này
            </Button>
          )}
          <CreateGroupChatModal
            visible={isGroupModalOpen}
            onClose={() => setIsGroupModalOpen(false)}
            members={groupMembers}
            currentUser={{
              ...(currentUser as User & { isActive?: boolean }),
              isActive: (currentUser as User & { isActive?: boolean }).isActive ?? true
            }}
            onSuccess={(groupName, memberIds) => {
              setPendingGroup({ name: groupName, members: memberIds });
              setIsGroupModalOpen(false);
            }}
            setApiInstance={undefined}
            bookingTitle={form.getFieldValue('title') || 'Cuộc họp nhóm dự án'}
          />

          {currentUser && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Người đặt: </Text>
              <Tag color="blue">
                {currentUser.name || currentUser.username || currentUser.email}
                {currentUser.email ? ` (${currentUser.email})` : ''}
              </Tag>
            </div>
          )}
        </Form>
      )}
    </ModalCustom>
  );
};

export default BookingForm;