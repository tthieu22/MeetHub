"use client";

import React, { useEffect, useState } from 'react';
import { DeleteOutlined, SearchOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';
import { message, Card, Typography, Button, Row, Col, Input, Space, Tag, Select, DatePicker, InputNumber, Checkbox, Spin } from 'antd';
import { StarFilled } from '@ant-design/icons';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

interface Device {
  name: string;
  quantity: number;
  note?: string;
  canBeRemoved?: boolean;
  _id?: string;
}

interface OperatingHours {
  open?: string;
  close?: string;
  closedDays?: string[];
  _id?: string;
}

interface BookingPolicy {
  minBookingHours?: number;
  maxBookingHours?: number;
  bufferTime?: number;
  _id?: string;
}

interface CancellationPolicy {
  minNotice?: number;
  lateCancelFee?: number;
  _id?: string;
}

interface Room {
  _id: string;
  name: string;
  capacity: number;
  location: string;
  description?: string;
  devices?: Device[];
  status: string;
  features?: string[];
  isActive: boolean;
  operatingHours?: OperatingHours;
  bookingPolicy?: BookingPolicy;
  cancellationPolicy?: CancellationPolicy;
  images?: string[];
  allowFood: boolean;
  bookingCount: number;
  createdAt?: Date;
  updatedAt?: Date;
  __v?: number;
}

const fieldStyles = [
  { bg: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)', border: '#1890ff', hoverBg: '#bae7ff', hoverText: '#1d39c4' },
  { bg: 'linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)', border: '#eb2f96', hoverBg: '#ffadd2', hoverText: '#9e1068' },
  { bg: 'linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)', border: '#13c2c2', hoverBg: '#87e8de', hoverText: '#08979c' },
];

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>('user');
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    location: '',
    status: '',
    fromDate: null as moment.Moment | null,
    toDate: null as moment.Moment | null,
    minCapacity: null as number | null,
    maxCapacity: null as number | null,
    hasProjector: false,
    allowFood: false,
    features: [] as string[],
  });
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const router = useRouter();
  const { token } = useUserStore();
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const isAdmin = role === 'admin';
  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchUserRole = async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để xem thông tin.');
      message.error('Vui lòng đăng nhập để tiếp tục.');
      router.push('/login');
      return;
    }

    try {
      const response = await axios.get(`${NESTJS_API_URL}/api/users/me`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.data && response.data.role) {
        setRole(response.data.role);
      } else {
        setError('Không thể lấy thông tin vai trò người dùng.');
        message.error('Không thể lấy thông tin vai trò người dùng.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy thông tin người dùng: ${errorMsg}`);
      message.error(errorMsg);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    }
  };

  const fetchRooms = async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để xem danh sách phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const endpoint = isAdmin ? '/api/rooms/get-all-rooms' : '/api/rooms/active';
      const url = `${NESTJS_API_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(isAdmin ? { filter: JSON.stringify({}) } : {}),
        },
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.data && response.data.success) {
        setRooms(response.data.data || []);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        }));
      } else {
        setError(response.data?.message || 'Lỗi không xác định từ server');
        message.error(response.data?.message || 'Lỗi khi tải dữ liệu');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy danh sách phòng: ${errorMsg}`);
      message.error(errorMsg);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để tìm kiếm phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.');
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const url = `${NESTJS_API_URL}/api/rooms/search`;
      const params = {
        keyword: searchParams.keyword.trim() || undefined,
        location: searchParams.location.trim() || undefined,
        status: searchParams.status || undefined,
        fromDate: searchParams.fromDate ? searchParams.fromDate.format('YYYY-MM-DD') : undefined,
        toDate: searchParams.toDate ? searchParams.toDate.format('YYYY-MM-DD') : undefined,
        minCapacity: searchParams.minCapacity || undefined,
        maxCapacity: searchParams.maxCapacity || undefined,
        hasProjector: searchParams.hasProjector || undefined,
        allowFood: searchParams.allowFood || undefined,
        features: searchParams.features.length > 0 ? searchParams.features.join(',') : undefined,
        page: 1,
        limit: pagination.limit,
      };

      const response = await axios.get(url, {
        params,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        setRooms(response.data.data || []);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        }));
      } else {
        setError(response.data.message || 'Không tìm thấy phòng phù hợp');
        message.error(response.data.message || 'Không tìm thấy phòng phù hợp');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi tìm kiếm: ${errorMsg}`);
      message.error(errorMsg);
      if (error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    const authToken = token || localStorage.getItem('access_token');
    if (!authToken) {
      setError('Vui lòng đăng nhập để xóa phòng.');
      message.error('Vui lòng đăng nhập để tiếp tục.');
      router.push('/login');
      return;
    }

    if (!isAdmin) {
      message.error('Bạn không có quyền xóa phòng!');
      return;
    }

    try {
      setLoading(true);
      const url = `${NESTJS_API_URL}/api/rooms/${id}/soft-delete`;
      const response = await axios.patch(url, {}, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        fetchRooms();
        message.success('Phòng đã được xóa mềm thành công!');
      } else {
        setError(response.data.message || 'Xóa phòng thất bại');
        message.error(response.data.message);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi xóa phòng: ${errorMsg}`);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRoomClick = (id: string) => {
    router.push(`/rooms/${id}`);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (role) {
      fetchRooms();
    }
  }, [pagination.page, pagination.limit, role]);

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto', 
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f2f5 100%)',
      minHeight: '100vh',
      position: 'relative',
    }}>
      {loading ? (
        <Card 
          styles={{ 
            body: { 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              border: '2px solid #1890ff',
              background: 'linear-gradient(135deg, #e6f7ff 0%, #f0f2f5 100%)',
              textAlign: 'center',
              padding: '40px',
            },
          }}
        >
          <Spin size="large" style={{ marginBottom: '16px' }} />
          <Text 
            style={{ 
              fontSize: '18px', 
              color: '#1d39c4', 
              fontWeight: 500,
              animation: 'pulse 1.5s infinite',
            }}
          >
            Đang tải...
          </Text>
          <style jsx>{`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.5; }
              100% { opacity: 1; }
            }
          `}</style>
        </Card>
      ) : error ? (
        <Card styles={{ 
          body: { 
            borderRadius: '12px', 
            boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
            border: '2px solid #ff4d4f' 
          },
        }}>
          <Text type="danger" style={{ fontSize: '16px', fontWeight: 500 }}>{error}</Text>
        </Card>
      ) : (
        <>
          <Title level={2} style={{ 
            color: '#1d39c4', 
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)', 
            marginBottom: '24px' 
          }}>
            {isAdmin ? 'Quản Lý Phòng Họp' : 'Danh Sách Phòng Khả Dụng'}
          </Title>
          <Card styles={{ 
            body: { 
              borderRadius: '12px', 
              boxShadow: '0 6px 16px rgba(0,0,0,0.15)', 
              marginBottom: '24px',
              background: 'linear-gradient(180deg, #ffffff, #f0faff)',
            },
          }}>
            <Space style={{ marginBottom: showAdvancedSearch ? '16px' : '0' }}>
              <Input
                placeholder="Tìm kiếm theo tên phòng"
                value={searchParams.keyword}
                onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                onPressEnter={handleSearch}
                style={{
                  width: showAdvancedSearch ? '300px' : '400px',
                  borderRadius: '8px',
                  border: '1px solid #1890ff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '8px 12px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #40c4ff'}
                onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #1890ff'}
              />
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #1890ff, #40c4ff)',
                  border: 'none',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Tìm kiếm
              </Button>
              <Button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                style={{
                  borderRadius: '8px',
                  background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
                  border: 'none',
                  color: '#fff',
                  padding: '8px 16px',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {showAdvancedSearch ? <><UpOutlined /> Ẩn</> : <><DownOutlined /> Chi tiết</>}
              </Button>
            </Space>
            {showAdvancedSearch && (
              <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '16px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Vị trí:</Text>
                    <Input
                      placeholder="Nhập vị trí (ví dụ: phòng 1901 - tầng 19)"
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                      style={{
                        borderRadius: '8px',
                        border: '1px solid #1890ff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '8px 12px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #40c4ff'}
                      onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #1890ff'}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Trạng thái:</Text>
                    <Select
                      placeholder="Chọn trạng thái"
                      value={searchParams.status || undefined}
                      onChange={(value) => setSearchParams({ ...searchParams, status: value })}
                      style={{ width: '100%', borderRadius: '8px' }}
                      allowClear
                    >
                      <Option value="available">Sẵn sàng</Option>
                      <Option value="occupied">Đang sử dụng</Option>
                      <Option value="maintenance">Bảo trì</Option>
                      <Option value="deleted">Đã xóa</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Tính năng:</Text>
                    <Select
                      mode="tags"
                      placeholder="Nhập tính năng (ví dụ: Wi-Fi, Âm thanh)"
                      value={searchParams.features}
                      onChange={(value) => setSearchParams({ ...searchParams, features: value })}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Từ ngày:</Text>
                    <DatePicker
                      value={searchParams.fromDate}
                      onChange={(date) => setSearchParams({ ...searchParams, fromDate: date })}
                      format="YYYY-MM-DD"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Đến ngày:</Text>
                    <DatePicker
                      value={searchParams.toDate}
                      onChange={(date) => setSearchParams({ ...searchParams, toDate: date })}
                      format="YYYY-MM-DD"
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Sức chứa tối thiểu:</Text>
                    <InputNumber
                      min={1}
                      value={searchParams.minCapacity}
                      onChange={(value) => setSearchParams({ ...searchParams, minCapacity: value })}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text strong style={{ color: '#1d39c4' }}>Sức chứa tối đa:</Text>
                    <InputNumber
                      min={1}
                      value={searchParams.maxCapacity}
                      onChange={(value) => setSearchParams({ ...searchParams, maxCapacity: value })}
                      style={{ width: '100%', borderRadius: '8px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Checkbox
                      checked={searchParams.hasProjector}
                      onChange={(e) => setSearchParams({ ...searchParams, hasProjector: e.target.checked })}
                    >
                      <Text style={{ color: '#1d39c4' }}>Có máy chiếu</Text>
                    </Checkbox>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Checkbox
                      checked={searchParams.allowFood}
                      onChange={(e) => setSearchParams({ ...searchParams, allowFood: e.target.checked })}
                    >
                      <Text style={{ color: '#1d39c4' }}>Cho phép đồ ăn</Text>
                    </Checkbox>
                  </Col>
                </Row>
              </Space>
            )}
          </Card>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {rooms.length > 0 ? (
              rooms.map((room) => (
                <Col xs={24} sm={12} md={8} lg={6} key={room._id}>
                  <Card
                    hoverable
                    onClick={() => handleRoomClick(room._id)}
                    styles={{ 
                      body: { 
                        padding: '16px',
                      },
                    }}
                    style={{
                      borderRadius: '12px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                      border: '2px solid #1890ff',
                      background: 'linear-gradient(180deg, #ffffff, #f0faff)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div
                      style={{
                        background: fieldStyles[0].bg,
                        border: `1px solid ${fieldStyles[0].border}`,
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '12px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = fieldStyles[0].hoverBg;
                        e.currentTarget.style.color = fieldStyles[0].hoverText;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = fieldStyles[0].bg;
                        e.currentTarget.style.color = '#1d39c4';
                      }}
                    >
                      <Title level={4} style={{ margin: 0, color: '#1d39c4' }}>
                        {room.name}
                      </Title>
                    </div>
                    <div
                      style={{
                        background: fieldStyles[1].bg,
                        border: `1px solid ${fieldStyles[1].border}`,
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '12px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = fieldStyles[1].hoverBg;
                        e.currentTarget.style.color = fieldStyles[1].hoverText;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = fieldStyles[1].bg;
                        e.currentTarget.style.color = '#595959';
                      }}
                    >
                      <Text strong style={{ color: '#1d39c4', fontSize: '14px' }}>Sức chứa: </Text>
                      <Text style={{ fontSize: '14px', color: '#595959' }}>{room.capacity} người</Text>
                    </div>
                    <div
                      style={{
                        background: fieldStyles[2].bg,
                        border: `1px solid ${fieldStyles[2].border}`,
                        borderRadius: '8px',
                        padding: '8px',
                        marginBottom: '12px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = fieldStyles[2].hoverBg;
                        e.currentTarget.style.color = fieldStyles[2].hoverText;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = fieldStyles[2].bg;
                        e.currentTarget.style.color = '#595959';
                      }}
                    >
                      <Text strong style={{ color: '#1d39c4', fontSize: '14px' }}>Vị trí: </Text>
                      <Text style={{ fontSize: '14px', color: '#595959' }}>{room.location}</Text>
                    </div>
                    <Tag
                      color={
                        room.status === 'available' ? '#52c41a' :
                        room.status === 'occupied' ? '#fa8c16' :
                        room.status === 'maintenance' ? '#faad14' :
                        room.status === 'deleted' ? '#ff4d4f' : '#722ed1'
                      }
                      style={{
                        fontSize: '14px',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <StarFilled style={{ marginRight: '4px' }} />
                      {room.status === 'available' ? 'Sẵn sàng' :
                       room.status === 'occupied' ? 'Đang sử dụng' :
                       room.status === 'maintenance' ? 'Bảo trì' :
                       room.status === 'deleted' ? 'Đã xóa' : room.status}
                    </Tag>
                    {isAdmin && (
                      <Button
                        type="primary"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSoftDelete(room._id);
                        }}
                        style={{
                          marginTop: '12px',
                          borderRadius: '8px',
                          background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
                          border: 'none',
                          transition: 'all 0.3s ease',
                          width: '100px',
                          height: '40px',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        Xóa
                      </Button>
                    )}
                  </Card>
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Card styles={{ 
                  body: { 
                    borderRadius: '12px', 
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    border: '2px solid #ff4d4f',
                    textAlign: 'center',
                  },
                }}>
                  <Text style={{ fontSize: '16px', color: '#8c8c8c' }}>Không tìm thấy phòng nào</Text>
                </Card>
              </Col>
            )}
          </Row>
          {pagination.totalPages > 1 && (
            <Space style={{ marginTop: '24px', justifyContent: 'center', width: '100%' }}>
              <Button
                disabled={pagination.page === 1}
                onClick={() => handlePageChange(pagination.page - 1)}
                style={{
                  borderRadius: '8px',
                  background: pagination.page > 1 ? 'linear-gradient(90deg, #1890ff, #40c4ff)' : '#f5f5f5',
                  border: 'none',
                  color: pagination.page > 1 ? '#fff' : '#8c8c8c',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Trước
              </Button>
              <Text style={{ fontSize: '14px', color: '#1d39c4' }}>
                Trang {pagination.page} / {pagination.totalPages}
              </Text>
              <Button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => handlePageChange(pagination.page + 1)}
                style={{
                  borderRadius: '8px',
                  background: pagination.page < pagination.totalPages ? 'linear-gradient(90deg, #1890ff, #40c4ff)' : '#f5f5f5',
                  border: 'none',
                  color: pagination.page < pagination.totalPages ? '#fff' : '#8c8c8c',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Sau
              </Button>
            </Space>
          )}
        </>
      )}
    </div>
  );
};

export default RoomList;