"use client";

import TableBooking, { BookingItem } from "@web/components/booking/table";
import CustomButton from "@web/components/CustomButton";
import { Card, Divider, Space, Typography, message, notification } from "antd";
import { useEffect, useState } from "react";
import axios from "../../../services/axios/customer.axios";
import BookingDetailModal from "@web/components/booking/BookingDetailModal";
import { useRequireRole } from "@web/hooks/useRequireRole";
const { Title } = Typography;

export default function BookingPage() {
  useRequireRole("admin");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "edit">("view");
  const [editingBooking, setEditingBooking] = useState<BookingItem | null>(
    null
  );
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [api, contextHolder] = notification.useNotification();
  const token = localStorage.getItem("token");
  // Lấy danh sách booking từ API
  useEffect(() => {
    fetchBookings();
  }, [pagination.current, pagination.pageSize]);
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/bookings/findAll", {
        params: {
          page: pagination.current,
          limit: pagination.pageSize,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setBookings(res.data || []);
      setPagination((prev) => ({
        ...prev,
        total: res.total || 0,
      }));
    } catch (err) {
      api.error({ message: "Không thể tải danh sách booking" });
    } finally {
      setLoading(false);
    }
  };
  // Xử lý phân trang
  const handlePageChange = (page: number, pageSize?: number) => {
    setPagination((prev) => ({
      ...prev,
      current: page,
      pageSize: pageSize || prev.pageSize,
    }));
  };

  // Xử lý các thao tác

  const handleShowDetail = (booking: BookingItem) => {
    setEditingBooking(booking);
    setModalMode("view");
    setIsModalOpen(true);
  };
  const handleEdit = (booking: BookingItem) => {
    setEditingBooking(booking);
    setModalMode("edit");
    setIsModalOpen(true);
  };
  const handleCancel = async (booking: BookingItem) => {
    try {
      console.log(booking);
      setLoading(true);
      const res = await axios.post(
        `/api/bookings/${booking._id}/cancel-admin`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.success) {
        api.success({ message: "Hủy booking thành công!" });
      } else {
        api.error({
          message: "Hủy booking không thành công!",
          description: res.message,
        });
      }
      fetchBookings(); // reload lại danh sách
    } catch (err: any) {
      api.error({
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
              setModalMode("create");
              setEditingBooking(null);
              setIsModalOpen(true);
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
        mode={modalMode}
        onClose={() => setIsModalOpen(false)}
        onUpdated={() => {
          // reload lại danh sách booking hoặc cập nhật state bookings\
          fetchBookings();
        }}
      />
    </div>
  );
}
