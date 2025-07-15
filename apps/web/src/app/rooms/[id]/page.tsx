'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/user.store';
import { message, Card, Typography, Calendar, Select, Spin, List, Tag, Button, Row, Col, Modal, Tooltip } from 'antd';
import { api, setAuthToken } from '@/lib/api';
import moment, { Moment } from 'moment';
import { CalendarOutlined, LeftOutlined } from '@ant-design/icons';
import BookingForm from '@/components/BookingForm';

// Set locale to Vietnamese for moment
moment.locale('vi');

const { Title, Text } = Typography;
const { Option } = Select;

interface Booking {
  _id: string;
  room: { _id: string; name: string; capacity: number; location: string };
  user: { _id: string; name: string };
  startTime: string;
  endTime: string;
  status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  title?: string;
  description?: string;
  participants: string[];
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  location: string;
}

const Bookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'day' | 'week' | 'month' | 'year'>('week'); // Default to 'week' for weekly view
  const [selectedDate, setSelectedDate] = useState<Moment>(moment().startOf('day')); // Start of today (00:00, 15/07/2025)
  const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    room: '',
    user: '',
    startTime: moment().add(19, 'minutes').toISOString(), // 10:30 AM today
    endTime: moment().add(49, 'minutes').toISOString(), // 11:00 AM today
    title: 'Cuộc họp nhóm dự án',
    description: 'Thảo luận kế hoạch phát triển sản phẩm mới',
    status: 'pending',
    participants: [],
  });
  const router = useRouter();
  const { roomId } = useParams();
  const { token, setToken } = useUserStore();

  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchRoom = useCallback(async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để xem thông tin phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.', 2);
      router.push('/login');
      return;
    }

    setAuthToken(authToken);
    try {
      setLoading(true);
      const response = await api.get(`/api/rooms/${roomId}`);

      if (response.data?.success) {
        setRoom(response.data.data);
        setBookingForm((prev) => ({ ...prev, room: response.data.data._id }));
      } else {
        throw new Error(response.data?.message || 'Lỗi không xác định từ server');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy thông tin phòng: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, router, roomId]);

  const fetchBookings = useCallback(async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken || !room) {
      return;
    }

    setAuthToken(authToken);
    try {
      setLoading(true);
      setError(null);

      let startDate: Moment, endDate: Moment;
      if (mode === 'day') {
        startDate = selectedDate.clone().startOf('day');
        endDate = selectedDate.clone().endOf('day');
      } else if (mode === 'week') {
        startDate = selectedDate.clone().startOf('isoWeek'); // Start of ISO week (Monday)
        endDate = selectedDate.clone().endOf('isoWeek'); // End of ISO week (Sunday)
      } else if (mode === 'month') {
        startDate = selectedDate.clone().startOf('month');
        endDate = selectedDate.clone().endOf('month');
      } else {
        startDate = selectedDate.clone().startOf('year');
        endDate = selectedDate.clone().endOf('year');
      }

      const response = await api.get(`${NESTJS_API_URL}/api/bookings/findAll`, {
        params: {
          roomName: room.name,
          date: mode === 'day' ? selectedDate.format('YYYY-MM-DD') : undefined,
          startTimeFrom: mode === 'week' ? startDate.toISOString() : undefined,
          startTimeTo: mode === 'week' ? endDate.toISOString() : undefined,
        },
      });

      if (response.data.success) {
        setBookings(response.data.data || []);
      } else {
        throw new Error(response.data.message || 'Không tìm thấy đặt phòng');
      }
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join('; ')
        : error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy danh sách đặt phòng: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [token, router, room, mode, selectedDate, NESTJS_API_URL]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (room) {
      fetchBookings();
    }
  }, [room, mode, selectedDate, fetchBookings]);

  const handleModeChange = (value: 'day' | 'week' | 'month' | 'year') => {
    setMode(value);
    if (value === 'week') {
      setSelectedDate(moment().startOf('isoWeek')); // Start week from Monday
    } else if (value === 'day') {
      setSelectedDate(moment().startOf('day'));
    }
    fetchBookings();
  };

  const handleDateSelect = (date: Moment) => {
    setSelectedDate(date.startOf('day'));
    setIsRoomModalVisible(true);
  };

  const handlePanelChange = (date: Moment) => {
    setSelectedDate(date.startOf('day'));
    fetchBookings();
  };

  const handleBookRoom = () => {
    setIsRoomModalVisible(false);
    setBookingForm({
      ...bookingForm,
      room: room?._id || '',
      user: token ? JSON.parse(atob(token.split('.')[1])).sub || JSON.parse(atob(token.split('.')[1])).userId : '',
      startTime: selectedDate.clone().add(19, 'minutes').toISOString(), // 10:30 AM
      endTime: selectedDate.clone().add(49, 'minutes').toISOString(), // 11:00 AM
      participants: [],
    });
    setIsBookingModalVisible(true);
  };

  const handleBookingSubmit = async (formData: any) => {
    try {
      if (!token) {
        message.error('Vui lòng đăng nhập để đặt phòng.');
        return;
      }
      console.log('Sending booking request with data:', formData);
      const response = await api.post('http://localhost:8000/api/bookings/add-booking', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Server response:', response.data);

      if (response.data.success) {
        message.success('Đặt phòng thành công!');
        fetchBookings();
        setIsBookingModalVisible(false);
        setBookingForm({
          room: room?._id || '',
          user: token ? JSON.parse(atob(token.split('.')[1])).sub || JSON.parse(atob(token.split('.')[1])).userId : '',
          startTime: moment().add(19, 'minutes').toISOString(), // 10:30 AM
          endTime: moment().add(49, 'minutes').toISOString(), // 11:00 AM
          title: 'Cuộc họp nhóm dự án',
          description: 'Thảo luận kế hoạch phát triển sản phẩm mới',
          status: 'pending',
          participants: [],
        });
      } else {
        throw new Error(response.data.message || 'Đặt phòng thất bại');
      }
    } catch (error: any) {
      console.error('Booking submission error:', error.response?.data || error.message);
      message.error(`Lỗi khi đặt phòng: ${error.response?.data?.message || error.message}`);
    }
  };

  const cellRender = (value: Moment) => {
    const dateBookings = bookings.filter((booking) =>
      moment(booking.startTime).isSame(value, 'day')
    );
    const hasBookings = dateBookings.length > 0;

    return (
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {hasBookings && (
          <Tooltip
            title={
              <div>
                <Text strong>Thông tin phòng:</Text>
                <p>Phòng: {room?.name}</p>
                <p>Sức chứa: {room?.capacity} người</p>
                <p>Vị trí: {room?.location}</p>
              </div>
            }
            placement="top"
          >
            <div
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '8px',
                height: '8px',
                backgroundColor: '#1890ff',
                borderRadius: '50%',
                border: '2px solid #fff',
                boxShadow: '0 0 4px rgba(24, 144, 255, 0.5)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
          </Tooltip>
        )}
        <List
          size="small"
          dataSource={dateBookings}
          renderItem={(booking) => (
            <List.Item
              style={{
                padding: '8px',
                borderRadius: '8px',
                margin: '4px 0',
                background: booking.status === 'confirmed' ? '#e6f7ff' : booking.status === 'cancelled' ? '#fffbe6' : booking.status === 'pending' ? '#fff0f6' : '#f6ffed',
                border: `1px solid ${booking.status === 'confirmed' ? '#1890ff' : booking.status === 'cancelled' ? '#faad14' : booking.status === 'pending' ? '#eb2f96' : '#52c41a'}`,
                transition: 'all 0.3s',
              }}
            >
              <Text strong style={{ fontSize: '14px', color: '#1d39c4' }}>
                {booking.title || 'Không có tiêu đề'} ({moment(booking.startTime).format('HH:mm')} - {moment(booking.endTime).format('HH:mm')})
              </Text>
              <Tag
                color={booking.status === 'confirmed' ? '#1890ff' : booking.status === 'cancelled' ? '#faad14' : booking.status === 'pending' ? '#eb2f96' : '#52c41a'}
                style={{ marginLeft: '8px' }}
              >
                {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : booking.status === 'pending' ? 'Chờ duyệt' : 'Hoàn thành'}
              </Tag>
            </List.Item>
          )}
        />
        <div style={{ textAlign: 'center', fontWeight: 500, color: value.isSame(moment(), 'day') ? '#1d39c4' : '#595959' }}>
          {value.format('dddd, DD/MM/YYYY')} {/* e.g., "Thứ Ba, 15/07/2025" */}
        </div>
      </div>
    );
  };

  const roomBookings = bookings.filter((booking) =>
    moment(booking.startTime).isSame(selectedDate, 'day')
  );

  return (
    <div style={{ 
      padding: '24px', 
      width: '100vw', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f2f5, #e6f7ff)', 
      overflow: 'auto',
    }}>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.6; }
          100% { opacity: 1; }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-top: 16px;
        }
        .calendar-week .ant-picker-cell {
          height: 120px;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 8px;
          text-align: center;
          background: #fff;
          transition: all 0.3s;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .calendar-week .ant-picker-cell-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .calendar-week .ant-picker-cell:hover {
          background: #e6f7ff;
          cursor: pointer;
        }
        .calendar-day {
          font-size: 16px;
          font-weight: 500;
          color: #1d39c4;
        }
        .ant-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(24, 144, 255, 0.4);
        }
        .ant-select:hover {
          transform: scale(1.02);
        }
      `}</style>
      {loading ? (
        <Card 
          styles={{ 
            body: { 
              borderRadius: '16px', 
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              border: '1px solid #1890ff',
              background: '#ffffff',
              textAlign: 'center',
              padding: '40px',
              width: '100%',
              height: '100%',
              display: 'flex',
              flex-direction: 'column',
              align-items: 'center',
              justify-content: 'center',
            },
          }}
        >
          <Spin size="large" style={{ marginBottom: '24px' }} />
          <Text 
            style={{ 
              fontSize: '28px', 
              color: '#1d39c4', 
              fontWeight: 600,
              animation: 'pulse 1.5s infinite',
            }}
          >
            Đang tải...
          </Text>
        </Card>
      ) : error ? (
        <Card styles={{ 
          body: { 
            borderRadius: '16px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            border: '1px solid #ff4d4f',
            textAlign: 'center',
            width: '100%',
            height: '100vh',
            display: 'flex',
            align-items: 'center',
            justify-content: 'center',
          },
        }}>
          <Text type="danger" style={{ fontSize: '28px', fontWeight: 600, color: '#ff4d4f' }}>{error}</Text>
        </Card>
      ) : room ? (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
            <Col>
              <Title level={2} style={{ 
                color: '#1d39c4',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)', 
                fontSize: '32px',
                fontWeight: 700,
                animation: 'fadeIn 0.5s ease-out',
              }}>
                Lịch Đặt Phòng - {room.name}
              </Title>
              <Text style={{ fontSize: '18px', color: '#595959' }}>
                Sức chứa: {room.capacity} người | Vị trí: {room.location}
              </Text>
            </Col>
            <Col>
              <Button
                type="default"
                icon={<LeftOutlined />}
                onClick={() => router.push('/rooms')}
                size="large"
                style={{
                  borderRadius: '20px',
                  background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
                  border: 'none',
                  color: '#ffffff',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                }}
              >
                Quay lại danh sách phòng
              </Button>
            </Col>
          </Row>
          <Card
            styles={{
              body: {
                borderRadius: '16px',
                boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                background: '#ffffff',
                padding: '24px',
                animation: 'fadeIn 0.5s ease-out',
              },
            }}
          >
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ fontSize: '18px', color: '#1d39c4' }}>Chế độ hiển thị:</Text>
                <Select
                  value={mode}
                  onChange={handleModeChange}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    fontSize: '16px',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <Option value="day">Ngày</Option>
                  <Option value="week">Tuần</Option>
                  <Option value="month">Tháng</Option>
                  <Option value="year">Năm</Option>
                </Select>
              </Col>
            </Row>
            {mode === 'week' && (
              <Row gutter={[2, 2]} className="calendar-week" style={{ marginBottom: '16px' }}>
                {Array.from({ length: 7 }, (_, index) => {
                  const day = selectedDate.clone().startOf('isoWeek').add(index, 'days'); // Start from Monday
                  const isCurrentDay = day.isSame(moment(), 'day');
                  return (
                    <Col key={index} style={{ textAlign: 'center', padding: '4px' }} onClick={() => handleDateSelect(day)}>
                      <div className="calendar-day" style={{ fontSize: '16px', fontWeight: 500, color: isCurrentDay ? '#1d39c4' : '#595959' }}>
                        {day.format('dddd, DD/MM/YYYY')} {/* e.g., "Thứ Hai, 14/07/2025" */}
                      </div>
                      <div style={{ flexGrow: 1 }}>{cellRender(day)}</div>
                    </Col>
                  );
                })}
              </Row>
            )}
            {mode !== 'week' && (
              <Calendar
                mode={mode}
                value={selectedDate}
                onSelect={handleDateSelect}
                onPanelChange={handlePanelChange}
                cellRender={cellRender}
                style={{
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  padding: '16px',
                  background: '#ffffff',
                }}
              />
            )}
          </Card>
          <Modal
            title={`Lịch sử đặt phòng ngày ${selectedDate.format('DD/MM/YYYY')}`}
            open={isRoomModalVisible}
            onCancel={() => setIsRoomModalVisible(false)}
            footer={[
              <Button key="back" onClick={() => setIsRoomModalVisible(false)}>
                Đóng
              </Button>,
              <Button key="book" type="primary" onClick={handleBookRoom}>
                Đặt phòng
              </Button>,
            ]}
          >
            <List
              size="small"
              dataSource={roomBookings}
              renderItem={(booking) => (
                <List.Item
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    margin: '4px 0',
                    background: booking.status === 'confirmed' ? '#e6f7ff' : booking.status === 'cancelled' ? '#fffbe6' : booking.status === 'pending' ? '#fff0f6' : '#f6ffed',
                    border: `1px solid ${booking.status === 'confirmed' ? '#1890ff' : booking.status === 'cancelled' ? '#faad14' : booking.status === 'pending' ? '#eb2f96' : '#52c41a'}`,
                  }}
                >
                  <Text strong style={{ fontSize: '14px', color: '#1d39c4' }}>
                    {booking.title || 'Không có tiêu đề'} ({moment(booking.startTime).format('HH:mm')} - {moment(booking.endTime).format('HH:mm')})
                  </Text>
                  <Tag
                    color={booking.status === 'confirmed' ? '#1890ff' : booking.status === 'cancelled' ? '#faad14' : booking.status === 'pending' ? '#eb2f96' : '#52c41a'}
                    style={{ marginLeft: '8px' }}
                  >
                    {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'cancelled' ? 'Đã hủy' : booking.status === 'pending' ? 'Chờ duyệt' : 'Hoàn thành'}
                  </Tag>
                </List.Item>
              )}
            />
            {roomBookings.length === 0 && <Text>Không có phòng nào được đặt vào ngày này.</Text>}
          </Modal>
          <BookingForm
            visible={isBookingModalVisible}
            onCancel={() => setIsBookingModalVisible(false)}
            onSubmit={handleBookingSubmit}
            initialValues={bookingForm}
          />
        </>
      ) : null}
    </div>
  );
};

export default Bookings;