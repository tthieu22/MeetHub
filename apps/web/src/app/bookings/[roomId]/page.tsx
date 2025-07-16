'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/user.store';
import { 
  message, 
  Card, 
  Typography, 
  Select, 
  Spin, 
  List, 
  Tag, 
  Button, 
  Row, 
  Col, 
  Modal, 
  Input 
} from 'antd';
import { api, setAuthToken } from '@/lib/api';
import moment, { Moment } from 'moment';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import BookingForm from '@/components/BookingForm';
import _ from 'lodash';

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
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    room: '',
    user: '',
    startTime: moment().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
    endTime: moment().set({ hour: 17, minute: 0, second: 0 }).toISOString(),
    title: 'Cuộc họp nhóm dự án',
    description: 'Thảo luận kế hoạch phát triển sản phẩm mới',
    status: 'pending',
    participants: [],
  });
  const [selectedStartDate, setSelectedStartDate] = useState<Moment | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Moment | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<'start' | 'end'>('start');
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));
  const router = useRouter();
  const { roomId } = useParams();
  const { token } = useUserStore();

  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const isStartDate = (day: Moment) => selectedStartDate && day.isSame(selectedStartDate, 'day');
  const isEndDate = (day: Moment) => selectedEndDate && day.isSame(selectedEndDate, 'day');
  const isInRange = (day: Moment) => selectedStartDate && selectedEndDate && 
    day.isBetween(selectedStartDate, selectedEndDate, 'day', '[]');

  const fetchData = useCallback(async () => {
    const authToken = token || accessToken;
    if (!authToken) {
      setError('Vui lòng đăng nhập để xem thông tin phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.', 2);
      return;
    }

    setAuthToken(authToken);
    setLoading(true);
    try {
      const [roomResponse, bookingsResponse] = await Promise.all([
        api.get(`/api/rooms/${roomId}`),
        api.get(`${NESTJS_API_URL}/api/bookings/findAll`, {
          params: {
            roomId,
            startTimeFrom: selectedWeek.clone().startOf('week').toISOString(),
            startTimeTo: selectedWeek.clone().endOf('week').toISOString(),
          },
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ]);

      if (roomResponse.data?.success) {
        setRoom(roomResponse.data.data);
        setBookingForm((prev) => ({ ...prev, room: roomResponse.data.data._id }));
      }
      if (bookingsResponse.data.success) {
        setBookings(bookingsResponse.data.data || []);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi tải dữ liệu: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [token, accessToken, roomId, selectedWeek, router, NESTJS_API_URL]);

  const debouncedFetchData = useMemo(() => _.debounce(fetchData, 300), [fetchData]);

  useEffect(() => {
    debouncedFetchData();
    return () => debouncedFetchData.cancel();
  }, [debouncedFetchData]);

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
    if (nextWeek.month() === selectedMonth) {
      setSelectedWeek(nextWeek);
    } else {
      setSelectedMonth(nextWeek.month());
      setSelectedWeek(nextWeek);
    }
  };

  const handlePreviousWeek = () => {
    const prevWeek = selectedWeek.clone().subtract(1, 'week');
    if (prevWeek.month() === selectedMonth) {
      setSelectedWeek(prevWeek);
    } else {
      setSelectedMonth(prevWeek.month());
      setSelectedWeek(prevWeek);
    }
  };

  const handleDateSelect = (date: Moment) => {
    if (selectionPhase === 'start') {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setSelectionPhase('end');
      message.info('Đã chọn ngày bắt đầu, vui lòng chọn ngày kết thúc');
    } else {
      if (date.isBefore(selectedStartDate)) {
        message.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
        setSelectedStartDate(date);
        setSelectedEndDate(null);
        setSelectionPhase('end');
      } else {
        setSelectedEndDate(date);
        setSelectionPhase('start');
        handleBookRoom();
      }
    }
  };

  const handleBookRoom = () => {
    if (selectedStartDate) {
      const startTime = selectedStartDate.clone().set({ hour: 9, minute: 0, second: 0 }).toISOString();
      const endTime = selectedEndDate
        ? selectedEndDate.clone().set({ hour: 17, minute: 0, second: 0 }).toISOString()
        : selectedStartDate.clone().set({ hour: 17, minute: 0, second: 0 }).toISOString();

      let userId = '';
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub || payload.userId || '';
        } catch (e) {
          console.error('Error parsing token:', e);
          userId = '';
        }
      }

      setBookingForm({
        ...bookingForm,
        room: room?._id || '',
        user: userId,
        startTime,
        endTime,
        participants: [],
      });
      setIsBookingModalVisible(true);
    }
  };

  const handleBookingSubmit = async (formData: any) => {
    try {
      if (!token || !accessToken) {
        message.error('Vui lòng đăng nhập và cung cấp access-token.');
        return;
      }

      setAuthToken(accessToken);
      const response = await api.post(`${NESTJS_API_URL}/api/bookings/add-booking`, formData, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.data.success) {
        message.success('Đặt phòng thành công!');
        debouncedFetchData();
        setIsBookingModalVisible(false);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
        setBookingForm({
          room: room?._id || '',
          user: token ? (JSON.parse(atob(token.split('.')[1]))?.sub || JSON.parse(atob(token.split('.')[1]))?.userId) || '' : '',
          startTime: moment().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
          endTime: moment().set({ hour: 17, minute: 0, second: 0 }).toISOString(),
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
      debouncedFetchData();
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
              background: booking.status === 'confirmed' ? '#e6f7ff' : 
                        booking.status === 'cancelled' ? '#fffbe6' : 
                        booking.status === 'pending' ? '#fff0f6' : '#f6ffed',
              border: `1px solid ${booking.status === 'confirmed' ? '#1890ff' : 
                        booking.status === 'cancelled' ? '#faad14' : 
                        booking.status === 'pending' ? '#eb2f96' : '#52c41a'}`,
            }}
          >
            <Text strong style={{ fontSize: '14px', color: '#1d39c4' }}>
              {booking.title || 'Không có tiêu đề'} ({moment(booking.startTime).format('HH:mm')} - {moment(booking.endTime).format('HH:mm')})
            </Text>
            <Tag
              color={booking.status === 'confirmed' ? '#1890ff' : 
                     booking.status === 'cancelled' ? '#faad14' : 
                     booking.status === 'pending' ? '#eb2f96' : '#52c41a'}
              style={{ marginLeft: '8px' }}
            >
              {booking.status === 'confirmed' ? 'Đã xác nhận' : 
               booking.status === 'cancelled' ? 'Đã hủy' : 
               booking.status === 'pending' ? 'Chờ duyệt' : 'Hoàn thành'}
            </Tag>
          </List.Item>
        )}
      />
    );
  };

  const renderMonthWeeks = (year: number, month: number) => {
    const startOfMonth = moment().year(year).month(month).startOf('month');
    const endOfMonth = moment().year(year).month(month).endOf('month');
    
    const weeks: moment.Moment[] = [];
    let currentWeek = startOfMonth.clone().startOf('week');
    
    while (currentWeek.isBefore(endOfMonth)) {
      weeks.push(currentWeek.clone());
      currentWeek.add(1, 'week');
    }
    
    return weeks;
  };

  const MonthView = ({ year, month, onWeekSelect }: { 
    year: number; 
    month: number; 
    onWeekSelect: (week: moment.Moment) => void 
  }) => {
    const weeks = renderMonthWeeks(year, month);
    
    return (
      <div style={{ marginTop: 16 }}>
        <Title level={4} style={{ color: '#1d39c4' }}>
          {moment().month(month).format('MMMM')} {year}
        </Title>
        <Row gutter={[16, 16]}>
          {weeks.map((week, index) => {
            const bookingCount = bookings.filter(b => 
              moment(b.startTime).isBetween(week, week.clone().endOf('week'), 'day', '[]')
            ).length;
            
            return (
              <Col key={index} span={24}>
                <Card 
                  hoverable
                  onClick={() => onWeekSelect(week)}
                  style={{ 
                    border: selectedWeek.isSame(week, 'week') ? '2px solid #1890ff' : '1px solid #d9d9d9',
                    borderRadius: 8,
                    backgroundColor: selectedWeek.isSame(week, 'week') ? '#e6f7ff' : '#fff',
                  }}
                >
                  <Text strong>
                    Tuần {index + 1}: {week.format('DD/MM')} - {week.clone().endOf('week').format('DD/MM')}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type={bookingCount > 0 ? 'success' : 'secondary'}>
                      {bookingCount} đặt phòng
                    </Text>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    );
  };

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f2f5, #e6f7ff)', 
    }}>
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}>
          <Spin size="large" />
        </div>
      ) : error && !accessToken ? (
        <Card style={{ 
          maxWidth: 500, 
          margin: '40px auto', 
          textAlign: 'center',
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Text type="danger" style={{ fontSize: 20, marginBottom: 16 }}>
            {error}
          </Text>
          <Input
            placeholder="Nhập access-token của bạn"
            value={accessToken || ''}
            onChange={handleTokenInputChange}
            style={{ marginBottom: 16 }}
          />
        </Card>
      ) : error ? (
        <Card style={{ 
          maxWidth: 500, 
          margin: '40px auto', 
          textAlign: 'center',
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Text type="danger" style={{ fontSize: 20, marginBottom: 16 }}>
            {error}
          </Text>
          <Button
            type="primary"
            onClick={debouncedFetchData}
            style={{ marginRight: 16 }}
          >
            Làm mới
          </Button>
          <Button onClick={() => router.push('/login')}>
            Đăng nhập
          </Button>
        </Card>
      ) : room ? (
        <>
          <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <Title level={2} style={{ color: '#1d39c4', marginBottom: 8 }}>
                Lịch Đặt Phòng - {room.name}
              </Title>
              <Text style={{ fontSize: 16, color: '#595959' }}>
                Sức chứa: {room.capacity} người | Vị trí: {room.location}
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<LeftOutlined />}
                onClick={() => router.push('/rooms')}
                size="large"
              >
                Quay lại danh sách phòng
              </Button>
            </Col>
          </Row>

          <Card
            style={{ 
              borderRadius: 16,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              marginBottom: 24
            }}
          >
            <Text type="secondary" style={{ 
              display: 'block', 
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 500,
              color: selectionPhase === 'start' ? '#1890ff' : '#52c41a'
            }}>
              {selectionPhase === 'start' 
                ? '👉 Đang chọn NGÀY BẮT ĐẦU' 
                : '👉 Đang chọn NGÀY KẾT THÚC'}
            </Text>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Chọn năm:</Text>
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: 10 }, (_, i) => moment().year() - 5 + i).map((year) => (
                    <Option key={year} value={year}>{year}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Chọn tháng:</Text>
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  style={{ width: '100%' }}
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                    <Option key={month} value={month}>
                      {moment().month(month).format('MMMM')}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>

            <MonthView 
              year={selectedYear} 
              month={selectedMonth} 
              onWeekSelect={(week) => setSelectedWeek(week)}
            />

            <Row justify="space-between" align="middle" style={{ margin: '24px 0' }}>
              <Button 
                icon={<LeftOutlined />} 
                onClick={handlePreviousWeek}
              >
                Tuần trước
              </Button>
              <Text strong style={{ fontSize: 18 }}>
                Tuần từ {selectedWeek.startOf('week').format('DD/MM')} đến {selectedWeek.endOf('week').format('DD/MM')}
              </Text>
              <Button 
                icon={<RightOutlined />} 
                onClick={handleNextWeek}
              >
                Tuần sau
              </Button>
            </Row>

            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {Array.from({ length: 7 }, (_, index) => {
                const day = selectedWeek.clone().startOf('week').add(index, 'days');
                const isCurrentMonth = day.year() === selectedYear && day.month() === selectedMonth;
                
                return (
                  <Col 
                    key={index} 
                    xs={24} sm={24} md={24} lg={24} xl={24}
                    style={{ 
                      backgroundColor: isStartDate(day) ? '#1890ff' : 
                                    isEndDate(day) ? '#52c41a' : 
                                    isInRange(day) ? '#e6f7ff' : '#fff',
                      border: isStartDate(day) ? '2px solid #1890ff' : 
                             isEndDate(day) ? '2px solid #52c41a' : 
                             '1px solid #d9d9d9',
                      borderRadius: 8,
                      padding: 8,
                      cursor: 'pointer',
                      position: 'relative',
                      minHeight: '120px'
                    }}
                    onClick={() => handleDateSelect(day)}
                  >
                    {isStartDate(day) && (
                      <Tag color="blue" style={{ 
                        position: 'absolute', 
                        top: 4, 
                        right: 4,
                        borderRadius: '50%',
                        padding: '0 6px',
                        fontWeight: 'bold'
                      }}>
                        BĐ
                      </Tag>
                    )}
                    
                    {isEndDate(day) && (
                      <Tag color="green" style={{ 
                        position: 'absolute', 
                        top: 4, 
                        right: 4,
                        borderRadius: '50%',
                        padding: '0 6px',
                        fontWeight: 'bold'
                      }}>
                        KT
                      </Tag>
                    )}

                    <div style={{ 
                      color: isStartDate(day) || isEndDate(day) ? '#fff' : 
                            isCurrentMonth ? '#1d39c4' : '#595959',
                      fontWeight: 500,
                      marginBottom: 8
                    }}>
                      {day.format('ddd DD/MM')}
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {cellRender(day)}
                    </div>
                  </Col>
                );
              })}
            </Row>

            {selectedStartDate && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Ngày bắt đầu: </Text>
                <Tag color="blue">{selectedStartDate.format('DD/MM/YYYY')}</Tag>
                {selectedEndDate && (
                  <>
                    <Text strong style={{ marginLeft: 8 }}>Ngày kết thúc: </Text>
                    <Tag color="green">{selectedEndDate.format('DD/MM/YYYY')}</Tag>
                  </>
                )}
              </div>
            )}
          </Card>

          <BookingForm
            visible={isBookingModalVisible}
            onCancel={() => {
              setIsBookingModalVisible(false);
              setSelectedStartDate(null);
              setSelectedEndDate(null);
              setSelectionPhase('start');
            }}
            onSubmit={handleBookingSubmit}
            initialValues={{
              ...bookingForm,
              startTime: selectedStartDate ? selectedStartDate.clone().set({ hour: 9, minute: 0, second: 0 }).toISOString() : moment().set({ hour: 9, minute: 0, second: 0 }).toISOString(),
              endTime: selectedEndDate ? selectedEndDate.clone().set({ hour: 17, minute: 0, second: 0 }).toISOString() : moment().set({ hour: 17, minute: 0, second: 0 }).toISOString(),
            }}
          />
        </>
      ) : null}
    </div>
  );
};

export default Bookings;