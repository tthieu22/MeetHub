"use client";

import React, { useEffect, useState } from 'react';
import { DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import axios from 'axios';

interface Device {
  name: string;
  quantity: number;
  note?: string;
  canBeRemoved?: boolean;
}

interface OperatingHours {
  open?: string;
  close?: string;
  closedDays?: string[];
}

interface BookingPolicy {
  minBookingHours?: number;
  maxBookingHours?: number;
  bufferTime?: number;
}

interface CancellationPolicy {
  minNotice?: number;
  lateCancelFee?: number;
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
}

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const isAdmin = false; // Giả lập, thay bằng logic kiểm tra quyền từ API

  const NESTJS_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Gọi API:', `${NESTJS_API_URL}/rooms/active`);
      const response = await axios.get(`${NESTJS_API_URL}/rooms/active`, {
        params: { page: 1, limit: 10 },
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('Response từ API:', response.data);
      if (response.data.success) {
        setRooms(response.data.data || []);
      } else {
        setError('Không thể tải danh sách phòng: ' + response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách phòng:', error.response?.data || error.message);
      setError('Lỗi khi kết nối đến server. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${NESTJS_API_URL}/rooms/search`, {
        params: { keyword: searchTerm },
      });
      if (response.data.success) {
        setRooms(response.data.data || []);
      } else {
        setError('Không tìm thấy phòng: ' + response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm phòng:', error.response?.data || error.message);
      setError('Lỗi khi tìm kiếm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSoftDelete = async (id: string) => {
    if (!isAdmin) {
      alert('Bạn không có quyền xóa phòng!');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await axios.patch(`${NESTJS_API_URL}/rooms/${id}/soft-delete`);
      if (response.data.success) {
        setRooms(rooms.filter(room => room._id !== id));
        alert('Phòng đã được xóa mềm thành công!');
      } else {
        setError('Xóa phòng thất bại: ' + response.data.message);
      }
    } catch (error) {
      console.error('Lỗi khi xóa phòng:', error.response?.data || error.message);
      setError('Xóa phòng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p style={{ padding: '20px' }}>Đang tải...</p>;
  if (error) return <p style={{ padding: '20px', color: 'red' }}>{error}</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Danh Sách Phòng Hoạt Động</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc vị trí"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: '8px', width: '300px', marginRight: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={handleSearch}
          style={{ padding: '8px 16px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          <SearchOutlined /> Tìm kiếm
        </button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {filteredRooms.length > 0 ? (
          filteredRooms.map((room) => (
            <div key={room._id} style={{ width: '100%', maxWidth: '300px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{room.name}</h3>
              <p>Sức chứa: {room.capacity}</p>
              <p>Vị trí: {room.location}</p>
              <p>Trạng thái: {room.status}</p>
              {isAdmin && (
                <button
                  onClick={() => handleSoftDelete(room._id)}
                  style={{ marginTop: '10px', padding: '5px 10px', backgroundColor: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  <DeleteOutlined /> Xóa
                </button>
              )}
            </div>
          ))
        ) : (
          <p style={{ padding: '20px' }}>Không có phòng nào được tìm thấy.</p>
        )}
      </div>
    </div>
  );
};

export default RoomList;