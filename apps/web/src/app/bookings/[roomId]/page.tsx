"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useUserStore } from '@/store/user.store';
import { message, Card, Typography, Calendar, Select, Spin, List, Tag, Button, Row, Col } from 'antd';
import { api, setAuthToken } from '@/lib/api';
import moment, { Moment } from 'moment';
import { CalendarOutlined, LeftOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

interface Booking {
  _id: string;
  room: { _id: string; name: string; capacity: number; location: string };
  user: { _id: string; name: string };
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  title?: string;
  description?: string;
  participants: { _id: string; name: string }[];
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
  const [mode, setMode] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState<Moment>(moment());
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
        startDate = selectedDate.clone().startOf('week');
        endDate = selectedDate.clone().endOf('week');
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
          date: mode !== 'year' ? selectedDate.format('YYYY-MM-DD') : undefined,
          startTimeFrom: mode === 'year' ? startDate.toISOString() : undefined,
          startTimeTo: mode === 'year' ? endDate.toISOString() : undefined,
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
  };

  const handleDateSelect = (date: Moment) => {
    setSelectedDate(date);
  };

  const dateCellRender = (value: Moment) => {
    const dateBookings = bookings.filter((booking) =>
      moment(booking.startTime).isSame(value, mode === 'year' ? 'year' : mode)
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
              background: booking.status === 'confirmed' ? '#e6f7ff' : booking.status === 'pending' ? '#fffbe6' : '#f6ffed',
              border: `1px solid ${booking.status === 'confirmed' ? '#1890ff' : booking.status === 'pending' ? '#faad14' : '#52c41a'}`,
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Text strong style={{ fontSize: '14px', color: '#1d39c4' }}>
              {booking.title || 'Không có tiêu đề'} ({moment(booking.startTime).format('HH:mm')} - {moment(booking.endTime).format('HH:mm')})
            </Text>
            <Tag
              color={booking.status === 'confirmed' ? '#1890ff' : booking.status === 'pending' ? '#faad14' : '#52c41a'}
              style={{ marginLeft: '8px' }}
            >
              {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'pending' ? 'Đang chờ' : 'Hoàn thành'}
            </Tag>
          </List.Item>
        )}
      />
    );
  };

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
            alignItems: 'center',
            justifyContent: 'center',
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(24, 144, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(24, 144, 255, 0.3)';
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
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <Option value="day">Ngày</Option>
                  <Option value="week">Tuần</Option>
                  <Option value="month">Tháng</Option>
                  <Option value="year">Năm</Option>
                </Select>
              </Col>
            </Row>
            <Calendar
              mode={mode === 'day' ? 'month' : mode}
              value={selectedDate}
              onSelect={handleDateSelect}
              dateCellRender={dateCellRender}
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                padding: '16px',
                background: '#ffffff',
              }}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default Bookings;