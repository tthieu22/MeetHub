'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/user.store';
import { message, Card, Typography, Select, Spin, List, Tag, Button, Row, Col, Modal, Input } from 'antd';
import { api, setAuthToken } from '@/lib/api';
import moment, { Moment } from 'moment';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import BookingForm from '@/components/BookingForm';

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
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedWeek, setSelectedWeek] = useState(moment().startOf('week'));
  const [isRoomModalVisible, setIsRoomModalVisible] = useState(false);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    room: '',
    user: '',
    startTime: moment().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
    endTime: moment().set({ hour: 10, minute: 0, second: 0 }).toISOString(),
    title: 'Cuộc họp nhóm dự án',
    description: 'Thảo luận kế hoạch phát triển sản phẩm mới',
    status: 'pending',
    participants: [],
  });
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
  const router = useRouter();
  const { roomId } = useParams();
  const { token, setToken } = useUserStore();

  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchRoom = useCallback(async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để xem thông tin phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.', 2);
      return;
    }

    setAuthToken(authToken);
    try {
      setLoading(true);
      const response = await api.get(`/api/rooms/${roomId}`);

      if (response.data?.success) {
        const roomData = response.data.data;
        setRoom(roomData);
        setBookingForm((prev) => ({ ...prev, room: roomData._id }));
        fetchBookings(); // Gọi fetchBookings ngay sau khi lấy room thành công
      } else {
        throw new Error(response.data?.message || 'Lỗi không xác định từ server');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy thông tin phòng: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        console.warn('Unauthorized access, please login:', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  }, [token, roomId]);

  const fetchBookings = useCallback(async () => {
    if (!accessToken) {
      setError('Vui lòng cung cấp access-token để tải danh sách đặt phòng.');
      message.error('Vui lòng nhập access-token để tiếp tục.', 2);
      return;
    }

    if (!room) {
      console.log('Room data not available yet, skipping fetchBookings');
      return;
    }

    setAuthToken(accessToken);
    try {
      setLoading(true);
      setError(null);

      const startDate = selectedWeek.clone().startOf('week');
      const endDate = selectedWeek.clone().endOf('week');

      // Lấy userId từ token (giả sử token là JWT)
      let userId = '';
      try {
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || payload.userId || '';
        } else if (accessToken) {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          userId = payload.sub || payload.userId || '';
        }
      } catch (e) {
        console.warn('Cannot decode token to get userId:', e);
      }

      console.log('Fetching bookings for room:', room._id, 'with params:', {
        roomId: room._id,
        userId: userId || '',
        startTimeFrom: startDate.toISOString(),
        startTimeTo: endDate.toISOString(),
      });

      const response = await api.get(`${NESTJS_API_URL}/api/bookings/findAll`, {
        params: {
          roomId: room._id, // Sử dụng room._id để lọc booking của phòng hiện tại
          userId: userId || '',
          startTimeFrom: startDate.toISOString(),
          startTimeTo: endDate.toISOString(),
        },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        setBookings(response.data.data || []);
        console.log('Bookings fetched for room:', room._id, response.data.data);
      } else {
        throw new Error(response.data.message || 'Không tìm thấy đặt phòng');
      }
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join('; ')
        : error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy danh sách đặt phòng: ${errorMsg}`);
      message.error(errorMsg, 2);
      console.error('API Error:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, room, selectedWeek, NESTJS_API_URL, token]);

  const refreshData = useCallback(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  useEffect(() => {
    if (room) {
      fetchBookings();
    }
  }, [room, fetchBookings]);

  useEffect(() => {
    fetchBookings();
  }, [selectedWeek, fetchBookings]);

  const handleYearChange = (value: number) => {
    setSelectedYear(value);
    setSelectedWeek(moment().year(value).month(selectedMonth).startOf('month').startOf('week'));
  };

  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
    setSelectedWeek(moment().year(selectedYear).month(value).startOf('month').startOf('week'));
  };

  const handleNextWeek = () => {
    const nextWeek = selectedWeek.clone().add(1, 'week');
    if (nextWeek.year() === selectedYear && nextWeek.month() === selectedMonth) {
      setSelectedWeek(nextWeek);
    }
  };

  const handlePreviousWeek = () => {
    const prevWeek = selectedWeek.clone().subtract(1, 'week');
    if (prevWeek.year() === selectedYear && prevWeek.month() === selectedMonth) {
      setSelectedWeek(prevWeek);
    }
  };

  const handleDateSelect = (date: Moment) => {
    setSelectedWeek(date.startOf('week'));
    setIsRoomModalVisible(true);
  };

  const handleBookRoom = () => {
    setIsRoomModalVisible(false);
    setBookingForm({
      ...bookingForm,
      room: room?._id || '',
      user: token ? JSON.parse(atob(token.split('.')[1])).sub || JSON.parse(atob(token.split('.')[1])).userId : '',
      startTime: selectedWeek.clone().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
      endTime: selectedWeek.clone().set({ hour: 10, minute: 0, second: 0 }).toISOString(),
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
      if (!accessToken) {
        message.error('Vui lòng cung cấp access-token.');
        return;
      }

      setAuthToken(accessToken);
      const response = await api.post(`${NESTJS_API_URL}/api/bookings/add-booking`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        message.success('Đặt phòng thành công!');
        fetchBookings(); // Cập nhật danh sách booking sau khi tạo
        setIsBookingModalVisible(false);
        setBookingForm({
          room: room?._id || '',
          user: token ? JSON.parse(atob(token.split('.')[1])).sub || JSON.parse(atob(token.split('.')[1])).userId : '',
          startTime: moment().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
          endTime: moment().set({ hour: 10, minute: 0, second: 0 }).toISOString(),
          title: 'Cuộc họp nhóm dự án',
          description: 'Thảo luận kế hoạch phát triển sản phẩm mới',
          status: 'pending',
          participants: [],
        });
      } else {
        throw new Error(response.data.message || 'Đặt phòng thất bại');
      }
    } catch (error: any) {
      message.error(`Lỗi khi đặt phòng: ${error.response?.data?.message || error.message}`);
      console.error('API Error:', error);
    }
  };

  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newToken = e.target.value;
    setAccessToken(newToken);
    localStorage.setItem('access_token', newToken);
    if (newToken) {
      setError(null);
      fetchRoom(); // Làm mới dữ liệu phòng khi token thay đổi
    }
  };

  const cellRender = (value: Moment) => {
    const dateBookings = bookings.filter((booking) =>
      moment(booking.startTime).isSame(value, 'day')
    );
    return (
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
    );
  };

  const roomBookings = bookings.filter((booking) =>
    moment(booking.startTime).isSame(selectedWeek, 'week')
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
        .token-input {
          margin-bottom: 16px;
          width: 100%;
          max-width: 300px;
        }
        .refresh-button {
          margin-left: 16px;
          border-radius: 20px;
          background: linear-gradient(90deg, #1890ff, #40a9ff);
          border: none;
          color: #ffffff;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }
        .refresh-button:hover {
          opacity: 0.9;
        }
        .back-button {
          border-radius: 20px;
          background: linear-gradient(90deg, #1890ff, #40a9ff);
          border: none;
          color: #ffffff;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
        }
        .back-button:hover {
          opacity: 0.9;
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            },
          }}
        >
          <Spin size="large" style={{ marginBottom: '24px' }} />
          <Text style={{ fontSize: '28px', color: '#1d39c4', fontWeight: 600 }}>Đang tải...</Text>
        </Card>
      ) : error && !accessToken ? (
        <Card styles={{ 
          body: { 
            borderRadius: '16px', 
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            border: '1px solid #ff4d4f',
            textAlign: 'center',
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}>
          <Text type="danger" style={{ fontSize: '28px', fontWeight: 600, color: '#ff4d4f' }}>{error}</Text>
          <Input
            className="token-input"
            placeholder="Nhập access-token của bạn"
            value={accessToken || ''}
            onChange={handleTokenInputChange}
            style={{ marginTop: '16px' }}
          />
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
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}>
          <Text type="danger" style={{ fontSize: '28px', fontWeight: 600, color: '#ff4d4f' }}>{error}</Text>
          <Button
            className="refresh-button"
            onClick={refreshData}
          >
            Làm mới
          </Button>
        </Card>
      ) : room ? (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: '32px' }}>
            <Col>
              <Title level={2} style={{ color: '#1d39c4', textShadow: '2px 2px 4px rgba(0,0,0,0.1)', fontSize: '32px', fontWeight: 700, animation: 'fadeIn 0.5s ease-out' }}>
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
                className="back-button"
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
                <Text strong style={{ fontSize: '18px', color: '#1d39c4' }}>Chọn năm:</Text>
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  style={{ width: '100%', borderRadius: '12px', fontSize: '16px', transition: 'all 0.3s ease' }}
                >
                  {Array.from({ length: 10 }, (_, i) => moment().year() - 5 + i).map((year) => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ fontSize: '18px', color: '#1d39c4' }}>Chọn tháng:</Text>
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  style={{ width: '100%', borderRadius: '12px', fontSize: '16px', transition: 'all 0.3s ease' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                    <Option key={month} value={month}>{moment().month(month).format('MMMM')}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Button icon={<LeftOutlined />} onClick={handlePreviousWeek} disabled={selectedWeek.isSame(moment().year(selectedYear).month(selectedMonth).startOf('month').startOf('week'), 'week')}>
                Tuần trước
              </Button>
              <Text strong style={{ fontSize: '18px', color: '#1d39c4' }}>
                Tuần từ {selectedWeek.startOf('week').format('DD/MM')} đến {selectedWeek.endOf('week').format('DD/MM')}
              </Text>
              <Button icon={<RightOutlined />} onClick={handleNextWeek} disabled={selectedWeek.isSame(moment().year(selectedYear).month(selectedMonth).endOf('month').endOf('week'), 'week')}>
                Tuần sau
              </Button>
            </Row>
            <Row gutter={[2, 2]} className="calendar-week">
              {Array.from({ length: 7 }, (_, index) => {
                const day = selectedWeek.clone().startOf('week').add(index, 'days');
                const isCurrentMonth = day.year() === selectedYear && day.month() === selectedMonth;
                return (
                  <Col key={index} style={{ textAlign: 'center', padding: '4px' }} onClick={() => handleDateSelect(day)}>
                    <div className="calendar-day" style={{ fontSize: '16px', fontWeight: 500, color: isCurrentMonth ? '#1d39c4' : '#595959' }}>
                      {day.format('ddd DD/MM')}
                    </div>
                    <div style={{ flexGrow: 1 }}>{cellRender(day)}</div>
                  </Col>
                );
              })}
            </Row>
          </Card>
          <Modal
            title={`Lịch sử đặt phòng tuần từ ${selectedWeek.startOf('week').format('DD/MM/YYYY')} đến ${selectedWeek.endOf('week').format('DD/MM/YYYY')}`}
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
            {roomBookings.length === 0 && <Text>Không có phòng nào được đặt trong tuần này.</Text>}
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