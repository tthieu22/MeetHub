"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUserStore } from "@/store/user.store";
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
} from "antd";
import { api } from "@/lib/api";
import moment, { Moment } from "moment";
import {
  LeftOutlined,
  RightOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  CloseOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import BookingForm from "@/components/BookingForm";
import _ from "lodash";
import BookingDetail from "../../../components/BookingDetail";

const { Title, Text } = Typography;
const { Option } = Select;

interface Booking {
  _id: string;
  room: { _id: string; name: string; capacity: number; location: string };
  user: { _id: string; name: string };
  startTime: string;
  endTime: string;
  status: "confirmed" | "cancelled" | "completed" | "pending" | "deleted";
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
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(moment().year());
  const [selectedMonth, setSelectedMonth] = useState(moment().month());
  const [selectedWeek, setSelectedWeek] = useState(moment().startOf("isoWeek"));
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Moment | null>(
    null
  );
  const [selectedEndDate, setSelectedEndDate] = useState<Moment | null>(null);
  const [selectionPhase, setSelectionPhase] = useState<"start" | "end">(
    "start"
  );
  const [showDetails, setShowDetails] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const router = useRouter();
  const { roomId } = useParams();
  const { token } = useUserStore();
  const userRole = useUserStore((state) => state.role) || "ADMIN";
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailBookingId, setDetailBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUserId) {
      console.log("UserId đã được load:", currentUserId);
    }

    const fetchUserId = async () => {
      try {
        const response = await api.get(`${NESTJS_API_URL}/api/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.data && response.data._id) {
          setCurrentUserId(response.data._id);
        }
      } catch (err) {
        console.error("Không thể lấy userId:", err);
      }
    };

    if (token) {
      fetchUserId();
    }
  }, [token]);

  const NESTJS_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const isStartDate = (day: Moment) =>
    selectedStartDate && day.isSame(selectedStartDate, "day");
  const isEndDate = (day: Moment) =>
    selectedEndDate && day.isSame(selectedEndDate, "day");
  const isInRange = (day: Moment) =>
    selectedStartDate &&
    selectedEndDate &&
    day.isBetween(selectedStartDate, selectedEndDate, "day", "[]");

  const checkBookingConflict = (start: Moment, end: Moment): boolean => {
    return bookings.some((booking) => {
      if (booking.status === "deleted") return false;
      const existingStart = moment(booking.startTime);
      const existingEnd = moment(booking.endTime);
      return (
        start.isBefore(existingEnd) && end.isAfter(existingStart)
      );
    });
  };

  const isDayFullyBooked = (day: Moment): boolean => {
    const dayStart = day.clone().startOf("day");
    const dayEnd = day.clone().endOf("day");
    const bookingsOnDay = bookings.filter(
      (booking) =>
        booking.status !== "deleted" &&
        moment(booking.startTime).isSame(day, "day")
    );

    let currentTime = dayStart.clone();
    while (currentTime.isBefore(dayEnd)) {
      const nextHour = currentTime.clone().add(1, "hour");
      const hasBooking = bookingsOnDay.some((booking) => {
        const bookingStart = moment(booking.startTime);
        const bookingEnd = moment(booking.endTime);
        return (
          currentTime.isBefore(bookingEnd) && nextHour.isAfter(bookingStart)
        );
      });
      if (!hasBooking) return false; // If any hour is free, the day is not fully booked
      currentTime.add(1, "hour");
    }
    return true; // All hours are booked
  };

  const fetchDataImmediately = useCallback(async () => {
    if (!token) {
      const errorMsg = "Vui lòng đăng nhập để xem thông tin phòng.";
      setError(errorMsg);
      Modal.error({
        title: "Lỗi",
        content: errorMsg,
        onOk: () => router.push("/login"),
      });
      return;
    }

    setLoading(true);
    try {
      const [roomResponse, bookingsResponse] = await Promise.all([
        api.get(`${NESTJS_API_URL}/api/rooms/${roomId}`),
        api.get(`${NESTJS_API_URL}/api/bookings/findAll`, {
          params: {
            roomId,
            filter: JSON.stringify({}),
          },
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (roomResponse.data?.success) {
        setRoom(roomResponse.data.data);
      } else {
        throw new Error(
          roomResponse.data?.message || "Không thể tải thông tin phòng."
        );
      }

      if (bookingsResponse.data.success) {
        const filteredBookings = bookingsResponse.data.data.filter(
          (booking: Booking) => booking.status !== "deleted"
        );
        setBookings(filteredBookings);
      } else {
        throw new Error(
          bookingsResponse.data?.message || "Không thể tải danh sách đặt phòng."
        );
      }
      setError(null);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Lỗi không xác định khi tải dữ liệu.";
      console.error("Lỗi khi tải dữ liệu:", error);
      setError(errorMsg);
      Modal.error({
        title: "Lỗi",
        content: errorMsg,
        onOk: () => router.push("/login"),
      });
    } finally {
      setLoading(false);
    }
  }, [token, roomId, NESTJS_API_URL, router]);

  const debouncedFetchData = useMemo(
    () => _.debounce(fetchDataImmediately, 300),
    [fetchDataImmediately]
  );

  const refreshData = () => {
    setLoading(true);
    fetchDataImmediately();
  };

  useEffect(() => {
    fetchDataImmediately();
    return () => debouncedFetchData.cancel();
  }, [fetchDataImmediately, debouncedFetchData]);

  const handleYearChange = (value: number) => {
    setSelectedYear(value);
    setSelectedWeek(
      moment().year(value).month(selectedMonth).startOf("isoWeek")
    );
  };

  const handleMonthChange = (value: number) => {
    setSelectedMonth(value);
    setSelectedWeek(
      moment().year(selectedYear).month(value).startOf("isoWeek")
    );
  };

  const handleNextWeek = () => {
    const nextWeek = selectedWeek.clone().add(1, "week").startOf("isoWeek");
    setSelectedWeek(nextWeek);
    setSelectedMonth(nextWeek.month());
  };

  const handlePreviousWeek = () => {
    const prevWeek = selectedWeek.clone().subtract(1, "week").startOf("isoWeek");
    setSelectedWeek(prevWeek);
    setSelectedMonth(prevWeek.month());
  };

  const handleDateSelect = (date: Moment) => {
    const currentDate = moment().startOf("day");

    if (date.isBefore(currentDate)) {
      Modal.error({
        title: "Lỗi",
        content:
          "Không thể đặt lịch từ quá khứ. Vui lòng chọn ngày từ hôm nay trở đi.",
        okText: "Đã hiểu",
      });
      return;
    }

    if (isDayFullyBooked(date)) {
      Modal.error({
        title: "Lỗi",
        content: "Ngày này đã kín lịch cả ngày. Vui lòng chọn ngày khác.",
        okText: "Đã hiểu",
      });
      return;
    }

    if (selectionPhase === "start") {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setSelectionPhase("end");
      message.info("Đã chọn ngày bắt đầu, vui lòng chọn ngày kết thúc");
    } else {
      if (date.isBefore(selectedStartDate)) {
        Modal.error({
          title: "Lỗi",
          content: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.",
          okText: "Đã hiểu",
        });
        return;
      }
      setSelectedEndDate(date);
      setSelectionPhase("start");
      setIsBookingModalVisible(true);
    }
  };

  const handleBookingSubmit = async (formData: any) => {
    if (!token) {
      Modal.error({
        title: "Lỗi",
        content: "Vui lòng đăng nhập để đặt phòng.",
        onOk: () => router.push("/login"),
      });
      return;
    }

    const startTime = moment(formData.startTime);
    const endTime = moment(formData.endTime);

    if (checkBookingConflict(startTime, endTime)) {
      Modal.error({
        title: "Lỗi",
        content: "Khung giờ này đã có lịch đặt. Vui lòng chọn khung giờ khác.",
        okText: "Đã hiểu",
      });
      return;
    }

    try {
      setLoading(true);
      const url = selectedBooking
        ? `${NESTJS_API_URL}/api/bookings/${selectedBooking._id}`
        : `${NESTJS_API_URL}/api/bookings/add-booking`;
      const method = selectedBooking ? "put" : "post";

      const response = await api[method](url, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        await fetchDataImmediately();
        Modal.success({
          title: "Thành công",
          content: `${selectedBooking ? "Cập nhật" : "Đặt"} phòng thành công!`,
          okText: "OK",
          onOk: () => {
            setIsBookingModalVisible(false);
            setSelectedStartDate(null);
            setSelectedEndDate(null);
            setSelectedBooking(null);
          },
        });
      } else {
        const errorMsg =
          response.data.message ||
          `${selectedBooking ? "Cập nhật" : "Đặt"} phòng thất bại`;
        Modal.error({
          title: "Lỗi",
          content: errorMsg,
          okText: "Đã hiểu",
        });
      }
    } catch (error: any) {
      const errorContent = error.response?.data?.message
        ? `Lỗi: ${error.response.data.message}`
        : `Lỗi khi ${selectedBooking ? "cập nhật" : "đặt"} phòng: ${error.message}`;

      Modal.error({
        title: "Lỗi",
        content: errorContent,
        okText: "Đã hiểu",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCancelModal = (bookingId: string) => {
    if (!currentUserId) {
      message.error("Không thể xác định người dùng. Vui lòng thử lại sau.");
      return;
    }

    setCancelBookingId(bookingId);
    setCancelModalVisible(true);
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId || !currentUserId) {
      message.error(
        "Không thể hủy vì thiếu thông tin người dùng hoặc booking."
      );
      return;
    }

    try {
      setLoading(true);
      const response = await api.post(
        `${NESTJS_API_URL}/api/bookings/${cancelBookingId}/cancel`,
        { userId: currentUserId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        Modal.success({
          title: "Thành công",
          content: "Hủy đặt phòng thành công!",
        });
        setCancelModalVisible(false);
        await fetchDataImmediately();
      } else {
        throw new Error(response.data.message || "Hủy thất bại");
      }
    } catch (error: any) {
      console.error("Lỗi khi hủy:", error);
      Modal.error({
        title: "Lỗi",
        content:
          error.response?.data?.message ||
          error.message ||
          "Lỗi không xác định",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setDetailBookingId(booking._id);
    setDetailModalVisible(true);
  };

  const cellRender = (value: Moment) => {
    const dateBookings = bookings.filter((booking) =>
      moment(booking.startTime).isSame(value, "day")
    );

    return (
      <List
        size="small"
        dataSource={dateBookings}
        renderItem={(booking) => (
          <List.Item
            style={{
              padding: "8px",
              borderRadius: "8px",
              margin: "4px 0",
              background:
                booking.status === "confirmed"
                  ? "#e6f7ff"
                  : booking.status === "cancelled"
                    ? "#fffbe6"
                    : booking.status === "pending"
                      ? "#fff0f6"
                      : booking.status === "completed"
                        ? "#f6ffed"
                        : "#fff",
              border: `1px solid ${
                booking.status === "confirmed"
                  ? "#1890ff"
                  : booking.status === "cancelled"
                    ? "#faad14"
                    : booking.status === "pending"
                      ? "#eb2f96"
                      : booking.status === "completed"
                        ? "#52c41a"
                        : "#d9d9d9"
              }`,
            }}
          >
            <Text strong style={{ fontSize: "14px", color: "#1d39c4" }}>
              {booking.title || "Không có tiêu đề"} (
              {moment(booking.startTime).format("HH:mm")} -{" "}
              {moment(booking.endTime).format("HH:mm")})
            </Text>
            <Tag
              color={
                booking.status === "confirmed"
                  ? "#1890ff"
                  : booking.status === "cancelled"
                    ? "#faad14"
                    : booking.status === "pending"
                      ? "#eb2f96"
                      : booking.status === "completed"
                        ? "#52c41a"
                        : "#d9d9d9"
              }
              style={{ marginLeft: "8px" }}
            >
              {booking.status === "confirmed"
                ? "Đã xác nhận"
                : booking.status === "cancelled"
                  ? "Đã hủy"
                  : booking.status === "pending"
                    ? "Chờ duyệt"
                    : booking.status === "completed"
                      ? "Hoàn thành"
                      : "Không xác định"}
            </Tag>
            {userRole === "ADMIN" && (
              <div style={{ marginTop: "8px" }}>
                <Button
                  icon={<CloseOutlined />}
                  onClick={() => openCancelModal(booking._id)}
                  style={{ marginRight: "8px" }}
                  danger
                >
                  Hủy
                </Button>
                <Button
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleViewDetails(booking)}
                >
                  Chi tiết
                </Button>
              </div>
            )}
          </List.Item>
        )}
      />
    );
  };

  const renderMonthWeeks = (year: number, month: number) => {
    const startOfMonth = moment().year(year).month(month).startOf("month");
    const endOfMonth = moment().year(year).month(month).endOf("month");

    const weeks: moment.Moment[] = [];
    let currentWeek = startOfMonth.clone().startOf("isoWeek");

    while (currentWeek.isBefore(endOfMonth) || currentWeek.isSame(endOfMonth, "day")) {
      weeks.push(currentWeek.clone());
      currentWeek.add(1, "week");
    }

    return weeks;
  };

  const MonthView = ({
    year,
    month,
    onWeekSelect,
  }: {
    year: number;
    month: number;
    onWeekSelect: (week: moment.Moment) => void;
  }) => {
    const weeks = renderMonthWeeks(year, month);

    return (
      <div style={{ marginTop: 16 }}>
        <Title level={4} style={{ color: "#1d39c4" }}>
          {moment().month(month).format("MMMM")} {year}
        </Title>
        <Row gutter={[16, 16]}>
          {weeks.map((week, index) => {
            const bookingCount = bookings.filter((b) =>
              moment(b.startTime).isBetween(
                week,
                week.clone().endOf("isoWeek"),
                "day",
                "[]"
              )
            ).length;

            return (
              <Col key={index} span={24}>
                <Card
                  hoverable
                  onClick={() => onWeekSelect(week)}
                  style={{
                    border: selectedWeek.isSame(week, "week")
                      ? "2px solid #1890ff"
                      : "1px solid #d9d9d9",
                    borderRadius: 8,
                    backgroundColor: selectedWeek.isSame(week, "week")
                      ? "#e6f7ff"
                      : "#fff",
                  }}
                >
                  <Text strong>
                    Tuần {index + 1}: {week.format("DD/MM")} -{" "}
                    {week.clone().endOf("isoWeek").format("DD/MM")}
                  </Text>
                  <div style={{ marginTop: 8 }}>
                    <Text type={bookingCount > 0 ? "success" : "secondary"}>
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

  let userId = "";
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userId = payload.sub || payload.userId || "";
    } catch (e) {
      console.error("Lỗi khi phân tích token:", e);
      Modal.error({
        title: "Lỗi",
        content: "Token không hợp lệ. Vui lòng đăng nhập lại.",
        onOk: () => router.push("/login"),
      });
    }
  }

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f2f5, #e6f7ff)",
      }}
    >
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        >
          <Spin size="large" tip="Đang tải dữ liệu..." />
        </div>
      ) : error ? (
        <Card
          style={{
            maxWidth: 500,
            margin: "40px auto",
            textAlign: "center",
            borderRadius: 16,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Text type="danger" style={{ fontSize: 20, marginBottom: 16 }}>
            {error}
          </Text>
          <Button
            type="primary"
            onClick={refreshData}
            style={{ marginRight: 16 }}
            icon={<ReloadOutlined />}
          >
            Tải lại
          </Button>
          <Button onClick={() => router.push("/login")}>Đăng nhập</Button>
        </Card>
      ) : room ? (
        <>
          <Row
            justify="space-between"
            align="middle"
            style={{ marginBottom: 24 }}
          >
            <Col>
              <Title level={2} style={{ color: "#1d39c4", marginBottom: 8 }}>
                Lịch Đặt Phòng - {room.name}
              </Title>
              <Text style={{ fontSize: 16, color: "#595959" }}>
                Sức chứa: {room.capacity} người | Vị trí: {room.location}
              </Text>
            </Col>
            <Col>
              <Button
                type="primary"
                icon={<LeftOutlined />}
                onClick={() => router.push("http://localhost:3000/")}
                size="large"
                style={{ marginRight: 8 }}
              >
                Quay lại
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={refreshData}
                size="large"
              >
                Làm mới
              </Button>
            </Col>
          </Row>

          <Card
            style={{
              borderRadius: 16,
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              marginBottom: 24,
            }}
          >
            <Row
              justify="space-between"
              align="middle"
              style={{ marginBottom: 16 }}
            >
              <Text
                type="secondary"
                style={{
                  display: "block",
                  marginBottom: 16,
                  fontSize: 16,
                  fontWeight: 500,
                  color: selectionPhase === "start" ? "#1890ff" : "#52c41a",
                }}
              >
                {selectionPhase === "start"
                  ? "👉 Đang chọn NGÀY BẮT ĐẦU"
                  : "👉 Đang chọn NGÀY KẾT THÚC"}
              </Text>
              <Button
                icon={showDetails ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowDetails(!showDetails)}
                style={{ marginBottom: 16 }}
              >
                {showDetails ? "Ẩn chi tiết" : "Hiện chi tiết"}
              </Button>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Chọn năm:
                </Text>
                <Select
                  value={selectedYear}
                  onChange={handleYearChange}
                  style={{ width: "100%" }}
                >
                  {Array.from(
                    { length: 10 },
                    (_, i) => moment().year() - 5 + i
                  ).map((year) => (
                    <Option key={year} value={year}>
                      {year}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>
                  Chọn tháng:
                </Text>
                <Select
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  style={{ width: "100%" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                    <Option key={month} value={month}>
                      {moment().month(month).format("MMMM")}
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

            <Row
              justify="space-between"
              align="middle"
              style={{ margin: "24px 0" }}
            >
              <Button icon={<LeftOutlined />} onClick={handlePreviousWeek}>
                Tuần trước
              </Button>
              <Text strong style={{ fontSize: 18 }}>
                Tuần từ {selectedWeek.startOf("isoWeek").format("DD/MM")} đến{" "}
                {selectedWeek.endOf("isoWeek").format("DD/MM")}
              </Text>
              <Button icon={<RightOutlined />} onClick={handleNextWeek}>
                Tuần sau
              </Button>
            </Row>

            {showDetails && (
              <>
                <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
                  {Array.from({ length: 7 }, (_, index) => {
                    const day = selectedWeek
                      .clone()
                      .startOf("isoWeek")
                      .add(index, "days");
                    const isCurrentMonth =
                      day.year() === selectedYear &&
                      day.month() === selectedMonth;
                    const isFullyBooked = isDayFullyBooked(day);

                    return (
                      <Col
                        key={index}
                        xs={24}
                        sm={24}
                        md={24}
                        lg={24}
                        xl={24}
                        style={{
                          backgroundColor: isFullyBooked
                            ? "#ff4d4f"
                            : isStartDate(day)
                              ? "#1890ff"
                              : isEndDate(day)
                                ? "#52c41a"
                                : isInRange(day)
                                  ? "#e6f7ff"
                                  : "#fff",
                          border: isFullyBooked
                            ? "2px solid #ff4d4f"
                            : isStartDate(day)
                              ? "2px solid #1890ff"
                              : isEndDate(day)
                                ? "2px solid #52c41a"
                                : "1px solid #d9d9d9",
                          borderRadius: 8,
                          padding: 8,
                          cursor:
                            isFullyBooked || day.isBefore(moment().startOf("day"))
                              ? "not-allowed"
                              : "pointer",
                          position: "relative",
                          minHeight: "120px",
                        }}
                        onClick={() => {
                          if (
                            !isFullyBooked &&
                            !day.isBefore(moment().startOf("day"))
                          ) {
                            handleDateSelect(day);
                          }
                        }}
                      >
                        {isStartDate(day) && (
                          <Tag
                            color="blue"
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              borderRadius: "50%",
                              padding: "0 6px",
                              fontWeight: "bold",
                            }}
                          >
                            BĐ
                          </Tag>
                        )}

                        {isEndDate(day) && (
                          <Tag
                            color="green"
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              borderRadius: "50%",
                              padding: "0 6px",
                              fontWeight: "bold",
                            }}
                          >
                            KT
                          </Tag>
                        )}

                        <div
                          style={{
                            color:
                              isFullyBooked || isStartDate(day) || isEndDate(day)
                                ? "#fff"
                                : isCurrentMonth
                                  ? "#1d39c4"
                                  : "#595959",
                            fontWeight: 500,
                            marginBottom: 8,
                          }}
                        >
                          {day.format("ddd DD/MM")}
                        </div>
                        <div style={{ maxHeight: 200, overflowY: "auto" }}>
                          {cellRender(day)}
                        </div>
                      </Col>
                    );
                  })}
                </Row>

                {selectedStartDate && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Ngày bắt đầu: </Text>
                    <Tag color="blue">
                      {selectedStartDate.format("DD/MM/YYYY")}
                    </Tag>
                    {selectedEndDate && (
                      <>
                        <Text strong style={{ marginLeft: 8 }}>
                          Ngày kết thúc:{" "}
                        </Text>
                        <Tag color="green">
                          {selectedEndDate.format("DD/MM/YYYY")}
                        </Tag>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </Card>

          <BookingForm
            visible={isBookingModalVisible}
            onCancel={() => {
              setIsBookingModalVisible(false);
              setSelectedStartDate(null);
              setSelectedEndDate(null);
              setSelectedBooking(null);
              setSelectionPhase("start");
            }}
            onSubmit={handleBookingSubmit}
            initialValues={{
              room: room?._id || "",
              user: userId,
              startTime:
                selectedBooking?.startTime ||
                (selectedStartDate
                  ? selectedStartDate
                      .clone()
                      .set({ hour: 9, minute: 0, second: 0 })
                      .toISOString()
                  : moment()
                      .add(1, "day")
                      .set({ hour: 9, minute: 0, second: 0 })
                      .toISOString()),
              endTime:
                selectedBooking?.endTime ||
                (selectedEndDate
                  ? selectedEndDate
                      .clone()
                      .set({ hour: 17, minute: 0, second: 0 })
                      .toISOString()
                  : moment()
                      .add(1, "day")
                      .set({ hour: 17, minute: 0, second: 0 })
                      .toISOString()),
              title: selectedBooking?.title || "Cuộc họp nhóm dự án",
              description:
                selectedBooking?.description ||
                "Thảo luận kế hoạch phát triển sản phẩm mới",
              status: selectedBooking?.status || "pending",
              participants: selectedBooking?.participants || [],
            }}
            bookings={bookings}
          />
        </>
      ) : null}
      <Modal
        title="Chi tiết đặt phòng"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {detailBookingId && <BookingDetail bookingId={detailBookingId} />}
      </Modal>

      <Modal
        title="Xác nhận hủy đặt phòng"
        open={cancelModalVisible}
        onOk={handleCancelBooking}
        onCancel={() => setCancelModalVisible(false)}
        okText="Hủy đặt phòng"
        cancelText="Đóng"
        okButtonProps={{ danger: true }}
      >
        <Text>Bạn có chắc chắn muốn hủy đặt phòng này?</Text>
      </Modal>
    </div>
  );
};

export default Bookings;