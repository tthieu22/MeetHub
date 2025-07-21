'use client';

import TableBooking, { BookingItem } from "@web/components/booking/table";
import CustomButton from "@web/components/CustomButton";
import { Card, Divider, Space, Typography, notification } from "antd";
import { useEffect, useState } from "react";
import { api } from "@web/lib/api";
import BookingDetailModal from "@web/components/booking/BookingDetailModal";
import BookingFormModal from "@web/components/booking/BookingFormModal";
import BookingEditModal from "@web/components/booking/BookingEditModal";
import { useRequireRole } from "@web/hooks/useRequireRole";
import { useUserStore } from "@web/store/user.store";

const { Title } = Typography;

export default function BookingPage() {
  useRequireRole("admin");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [apiNotification, contextHolder] = notification.useNotification();
  const { token, role } = useUserStore();

  useEffect(() => {
    fetchBookings();
  }, [pagination.current, pagination.pageSize]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/bookings/findAll", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
      });
      const bookingsData = Array.isArray(res.data.data) ? res.data.data : [];
      setBookings(bookingsData);
      setPagination((prev) => ({
        ...prev,
        total: res.data.total || 0,
      }));
    } catch (err: any) {
      console.error('Lỗi khi tải bookings:', err.response?.data);
      apiNotification.error({ 
        message: err.response?.data?.message || "Không thể tải danh sách booking" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  };

  const handleShowDetail = (booking: BookingItem) => {
    setEditingBooking(booking);
    setIsModalOpen(true);
  };

  const handleEdit = async (booking: BookingItem) => {
    if (!booking || !booking._id) {
      console.log('Invalid booking data:', booking);
      apiNotification.error({
        message: 'Dữ liệu booking không hợp lệ',
        description: 'Không thể chỉnh sửa vì dữ liệu booking không hợp lệ.',
      });
      return;
    }

    try {
      console.log('Checking admin role with token:', token ? 'Present' : 'Missing');
      const userRes = await api.get('/api/users/me');
      console.log('Kiểm tra vai trò admin:', userRes.data);
      console.log('Booking.status khi chỉnh sửa:', booking.status);
      console.log('Booking.room khi chỉnh sửa:', booking.room);
      if (userRes.data.role !== 'admin') {
        apiNotification.error({
          message: 'Không có quyền',
          description: 'Chỉ admin mới có quyền chỉnh sửa booking.',
        });
        return;
      }
      setEditingBooking(booking);
      setIsEditModalOpen(true);
    } catch (err: any) {
      console.error('Lỗi khi kiểm tra vai trò:', err);
      if (err.response?.status === 401) {
        console.log('401 Unauthorized in handleEdit, redirecting to login');
        apiNotification.error({
          message: 'Phiên đăng nhập hết hạn',
          description: 'Vui lòng đăng nhập lại để tiếp tục.',
        });
        window.location.href = '/login';
      } else {
        apiNotification.error({
          message: 'Không thể xác minh vai trò admin. Vui lòng thử lại.',
        });
      }
    }
  };

  const handleCancel = async (booking: BookingItem) => {
    if (!booking || !booking._id) {
      console.log('Invalid booking data for cancel:', booking);
      apiNotification.error({
        message: 'Dữ liệu booking không hợp lệ',
        description: 'Không thể hủy vì dữ liệu booking không hợp lệ.',
      });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/api/bookings/${booking._id}/cancel-admin`, {});
      if (res.data.success) {
        apiNotification.success({ message: "Hủy booking thành công!" });
      } else {
        apiNotification.error({
          message: "Hủy booking không thành công!",
          description: res.data.message,
        });
      }
      fetchBookings();
    } catch (err: any) {
      console.error('Lỗi khi hủy booking:', err.response?.data);
      apiNotification.error({
        message: err?.response?.data?.message || "Hủy booking thất bại!",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {contextHolder}
      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <div className="flex items-center justify-between">
          <div>
            <Title level={3} className="mb-0">
              Quản lý Booking
            </Title>
            <p className="text-gray-500">Thêm, chỉnh sửa và quản lý booking</p>
          </div>
          <CustomButton
            type="primary"
            onClick={() => {
              setIsFormModalOpen(true);
            }}
          >
            + Đặt lịch
          </CustomButton>
        </div>

        <Divider />

        <Card
          title="Danh sách lịch đặt phòng"
          style={{ borderRadius: "12px" }}
          styles={{ body: { padding: "0" } }}
        >
          <TableBooking
            data={bookings}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onShowDetail={handleShowDetail}
            onEdit={handleEdit}
            onCancel={handleCancel}
          />
        </Card>
      </Space>

      <BookingDetailModal
        open={isModalOpen}
        booking={editingBooking}
        onClose={() => setIsModalOpen(false)}
        loading={loading}
      />

      <BookingFormModal
        open={isFormModalOpen}
        onCancel={() => {
          setIsFormModalOpen(false);
        }}
        onSuccess={() => {
          apiNotification.success({
            message: 'Tạo booking thành công!',
          });
          fetchBookings();
        }}
      />

      <BookingEditModal
        open={isEditModalOpen}
        booking={editingBooking}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingBooking(null);
        }}
        onSuccess={() => {
          apiNotification.success({
            message: 'Cập nhật booking thành công!',
          });
          fetchBookings();
          setEditingBooking(null);
        }}
      />
    </div>
  );
}