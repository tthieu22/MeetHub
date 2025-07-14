"use client";

import React, { useEffect, useState } from 'react';
import { DeleteOutlined, SearchOutlined, DownOutlined, UpOutlined, PlusOutlined, HomeOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@web/store/user.store';
import { message, Card, Typography, Button, Input, Space, Tag, Select, DatePicker, InputNumber, Checkbox, Spin, Modal, Table, Row, Col } from 'antd';
import moment from 'moment';

import AddRoom from './AddRoom';
import UpdateRoom from './UpdateRoom';

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
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
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

  const handleBackToHome = () => {
    router.push('http://localhost:3000');
  };

  const showAddModal = () => {
    setIsAddModalVisible(true);
  };

  const handleModalClose = () => {
    setIsAddModalVisible(false);
  };

  const handleUpdateClick = (room: Room) => {
    setSelectedRoom(room);
    setIsUpdateModalVisible(true);
  };

  const handleUpdateModalClose = () => {
    setIsUpdateModalVisible(false);
    setSelectedRoom(null);
  };

  useEffect(() => {
    fetchUserRole();
  }, []);

  useEffect(() => {
    if (role) {
      fetchRooms();
    }
  }, [pagination.page, pagination.limit, role]);

  const columns = [
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text style={{ fontSize: '18px', color: '#1d39c4' }}>{text}</Text>,
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => <Text style={{ fontSize: '18px', color: '#595959' }}>{capacity} người</Text>,
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      render: (text: string) => <Text style={{ fontSize: '18px', color: '#595959' }}>{text}</Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'available' ? '#52c41a' :
            status === 'occupied' ? '#fa8c16' :
            status === 'maintenance' ? '#faad14' :
            status === 'deleted' ? '#ff4d4f' : '#722ed1'
          }
          style={{ fontSize: '18px', padding: '8px 16px', borderRadius: '12px' }}
        >
          {status === 'available' ? 'Sẵn sàng' :
           status === 'occupied' ? 'Đang sử dụng' :
           status === 'maintenance' ? 'Bảo trì' :
           status === 'deleted' ? 'Đã xóa' : status}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: any, record: Room) => (
        <Space size={16}>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateClick(record);
            }}
            size="large"
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              color: '#ffffff',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Sửa
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleSoftDelete(record._id);
            }}
            size="large"
            style={{
              borderRadius: '20px',
              background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
              border: 'none',
              padding: '12px 24px',
              fontSize: '16px',
              color: '#ffffff',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      padding: '24px', 
      width: '100vw', 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f2f5, #e6f7ff)',
      overflow: 'auto',
      position: 'relative',
      color: '#1d39c4',
    }}>
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
          <style jsx>{`
            @keyframes pulse {
              0% { opacity: 1; }
              50% { opacity: 0.6; }
              100% { opacity: 1; }
            }
          `}</style>
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
      ) : (
        <>
          <Title level={2} style={{ 
            color: '#1d39c4',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)', 
            marginBottom: '32px',
            fontSize: '32px',
            fontWeight: 700,
          }}>
            {isAdmin ? 'Quản Lý Phòng Họp' : 'Danh Sách Phòng Khả Dụng'}
          </Title>
          <Card styles={{ 
            body: { 
              borderRadius: '16px', 
              boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
              marginBottom: '32px',
              background: '#ffffff',
              padding: '24px',
              width: '100%',
            },
          }}>
            <Space style={{ marginBottom: showAdvancedSearch ? '32px' : '0', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: '16px' }}>
              <Input
                placeholder="Tìm kiếm theo tên phòng"
                value={searchParams.keyword}
                onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                onPressEnter={handleSearch}
                style={{
                  width: showAdvancedSearch ? '60%' : '70%',
                  minWidth: '300px',
                  borderRadius: '20px',
                  border: '2px solid #ff6f61',
                  background: 'linear-gradient(135deg, #fff5f5, #ffe7e6)',
                  boxShadow: '0 8px 24px rgba(255, 111, 97, 0.2)',
                  padding: '16px 32px',
                  fontSize: '18px',
                  color: '#1d39c4',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '2px solid #ff4d4f';
                  e.currentTarget.style.boxShadow = '0 10px 28px rgba(255, 77, 79, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '2px solid #ff6f61';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 111, 97, 0.2)';
                }}
              />
              <Space size={16}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  size="large"
                  style={{
                    borderRadius: '20px',
                    background: 'linear-gradient(90deg, #1890ff, #40a9ff)',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '16px',
                    color: '#ffffff',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Tìm kiếm
                </Button>
                <Button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  size="large"
                  style={{
                    borderRadius: '20px',
                    background: 'linear-gradient(90deg, #ff4d4f, #ff7875)',
                    border: 'none',
                    color: '#ffffff',
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(255, 77, 79, 0.3)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {showAdvancedSearch ? <><UpOutlined /> Ẩn</> : <><DownOutlined /> Chi tiết</>}
                </Button>
                <Button
                  type="default"
                  icon={<HomeOutlined />}
                  onClick={handleBackToHome}
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
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Trang chủ
                </Button>
                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showAddModal}
                    size="large"
                    style={{
                      borderRadius: '20px',
                      background: 'linear-gradient(90deg, #52c41a, #73d13d)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '12px 24px',
                      fontSize: '16px',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 12px rgba(82, 196, 26, 0.3)',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    Tạo phòng
                  </Button>
                )}
              </Space>
            </Space>
            {showAdvancedSearch && (
              <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '32px' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Vị trí:</Text>
                    <Input
                      placeholder="Nhập vị trí (ví dụ: phòng 1901 - tầng 19)"
                      value={searchParams.location}
                      onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid #d9d9d9',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        padding: '12px 16px',
                        fontSize: '16px',
                        width: '100%',
                        color: '#1d39c4',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #40a9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #d9d9d9'}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Trạng thái:</Text>
                    <Select
                      placeholder="Chọn trạng thái"
                      value={searchParams.status || undefined}
                      onChange={(value) => setSearchParams({ ...searchParams, status: value })}
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                      allowClear
                    >
                      <Option value="available">Sẵn sàng</Option>
                      <Option value="occupied">Đang sử dụng</Option>
                      <Option value="maintenance">Bảo trì</Option>
                      <Option value="deleted">Đã xóa</Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Tính năng:</Text>
                    <Select
                      mode="tags"
                      placeholder="Nhập tính năng (ví dụ: Wi-Fi, Âm thanh)"
                      value={searchParams.features}
                      onChange={(value) => setSearchParams({ ...searchParams, features: value })}
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Từ ngày:</Text>
                    <DatePicker
                      value={searchParams.fromDate}
                      onChange={(date) => setSearchParams({ ...searchParams, fromDate: date })}
                      format="YYYY-MM-DD"
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Đến ngày:</Text>
                    <DatePicker
                      value={searchParams.toDate}
                      onChange={(date) => setSearchParams({ ...searchParams, toDate: date })}
                      format="YYYY-MM-DD"
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Sức chứa tối thiểu:</Text>
                    <InputNumber
                      min={1}
                      value={searchParams.minCapacity}
                      onChange={(value) => setSearchParams({ ...searchParams, minCapacity: value })}
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text strong style={{ color: '#1d39c4', fontSize: '18px', marginBottom: '8px' }}>Sức chứa tối đa:</Text>
                    <InputNumber
                      min={1}
                      value={searchParams.maxCapacity}
                      onChange={(value) => setSearchParams({ ...searchParams, maxCapacity: value })}
                      style={{ width: '100%', borderRadius: '12px', fontSize: '16px' }}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox
                      checked={searchParams.hasProjector}
                      onChange={(e) => setSearchParams({ ...searchParams, hasProjector: e.target.checked })}
                      style={{ fontSize: '16px', marginBottom: '8px' }}
                    >
                      <Text style={{ color: '#1d39c4', fontSize: '16px' }}>Có máy chiếu</Text>
                    </Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox
                      checked={searchParams.allowFood}
                      onChange={(e) => setSearchParams({ ...searchParams, allowFood: e.target.checked })}
                      style={{ fontSize: '16px', marginBottom: '8px' }}
                    >
                      <Text style={{ color: '#1d39c4', fontSize: '16px' }}>Cho phép đồ ăn</Text>
                    </Checkbox>
                  </Col>
                </Row>
              </Space>
            )}
          </Card>
          <Table
            columns={columns}
            dataSource={rooms}
            rowKey="_id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: handlePageChange,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              style: { marginTop: '16px' },
            }}
            style={{ marginTop: '32px' }}
            onRow={(record) => ({
              onClick: () => handleRoomClick(record._id),
            })}
            scroll={{ x: 'max-content' }}
          />
        </>
      )}
      <Modal
        title="Thêm phòng mới"
        open={isAddModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: '1200px' }}
      >
        <AddRoom onClose={handleModalClose} fetchRooms={fetchRooms} />
      </Modal>
      <Modal
        title="Sửa thông tin phòng"
        open={isUpdateModalVisible}
        onCancel={handleUpdateModalClose}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: '1200px' }}
      >
        <UpdateRoom room={selectedRoom} onClose={handleUpdateModalClose} fetchRooms={fetchRooms} />
      </Modal>
    </div>
  );
};

export default RoomList;