"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  DeleteOutlined,
  SearchOutlined,
  DownOutlined,
  UpOutlined,
  PlusOutlined,
  EditOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import {
  message,
  Card,
  Typography,
  Button,
  Input,
  Space,
  Tag,
  Select,
  DatePicker,
  InputNumber,
  Checkbox,
  Spin,
  Modal,
  Table,
  Row,
  Col,
} from "antd";
import moment from "moment";
import _ from "lodash";
import AddRoom from "./AddRoom";
import UpdateRoom from "./UpdateRoom";

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

const validStatuses = ["available", "occupied", "maintenance", "cleaning"];

const RoomList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>("user");
  const [searchParams, setSearchParams] = useState({
    keyword: "",
    location: "",
    status: "",
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

  const isAdmin = role === "admin";
  const NESTJS_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"; // Đồng bộ cổng 3000

  const fetchUserRole = useCallback(async () => {
    const authToken = token || localStorage.getItem("access_token");
    if (!authToken) {
      setError("Vui lòng đăng nhập để xem thông tin.");
      message.error("Vui lòng đăng nhập để tiếp tục.", 2);
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${NESTJS_API_URL}/api/users/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.role) {
        setRole(response.data.role);
      } else {
        throw new Error("Không thể lấy thông tin vai trò người dùng.");
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy thông tin người dùng: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  const fetchRooms = useCallback(async () => {
    const authToken = token || localStorage.getItem("access_token");
    if (!authToken) {
      setError("Vui lòng đăng nhập để xem danh sách phòng.");
      message.error("Vui lòng đăng nhập để tiếp tục.", 2);
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const endpoint = isAdmin
        ? "/api/rooms/get-all-rooms"
        : "/api/rooms/active";
      const url = `${NESTJS_API_URL}${endpoint}`;
      const response = await axios.get(url, {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(isAdmin ? { filter: JSON.stringify({}) } : {}),
        },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data?.success) {
        const fetchedRooms = response.data.data || [];
        setRooms(fetchedRooms);
        setFilteredRooms(fetchedRooms);
        setPagination((prev) => ({
          ...prev,
          total: response.data.total || 0,
          totalPages: response.data.totalPages || 1,
        }));
      } else {
        throw new Error(
          response.data?.message || "Lỗi không xác định từ server"
        );
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(`Lỗi khi lấy danh sách phòng: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [token, router, isAdmin, pagination.page, pagination.limit]);

  const handleSearch = useCallback(async () => {
    const authToken = token || localStorage.getItem("access_token");
    if (!authToken) {
      setError("Vui lòng đăng nhập để tìm kiếm phòng.");
      message.error("Vui lòng đăng nhập để tiếp tục.", 2);
      router.push("/login");
      return;
    }

    try {
      setSearchLoading(true);
      setError(null);

      const params: Record<string, any> = {
        page: 1,
        limit: pagination.limit,
      };

      if (searchParams.keyword?.trim())
        params.keyword = searchParams.keyword.trim().toLowerCase();
      if (searchParams.location?.trim())
        params.location = searchParams.location.trim();
      if (searchParams.status && validStatuses.includes(searchParams.status))
        params.status = searchParams.status;
      if (searchParams.fromDate)
        params.fromDate = searchParams.fromDate.format("YYYY-MM-DD");
      if (searchParams.toDate)
        params.toDate = searchParams.toDate.format("YYYY-MM-DD");
      if (searchParams.minCapacity !== null)
        params.minCapacity = searchParams.minCapacity;
      if (searchParams.maxCapacity !== null)
        params.maxCapacity = searchParams.maxCapacity;
      if (searchParams.hasProjector)
        params.hasProjector = searchParams.hasProjector;
      if (searchParams.allowFood) params.allowFood = searchParams.allowFood;
      if (searchParams.features?.length)
        params.features = searchParams.features.join(",");

      const response = await axios.get(`${NESTJS_API_URL}/api/rooms/search`, {
        params,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        const fetchedRooms = response.data.data || [];
        const sortedRooms = fetchedRooms.sort((a: Room, b: Room) => {
          const keyword = searchParams.keyword?.trim().toLowerCase() || "";
          const aMatch = a.name.toLowerCase().startsWith(keyword) ? 1 : 0;
          const bMatch = b.name.toLowerCase().startsWith(keyword) ? 1 : 0;
          return bMatch - aMatch;
        });
        setFilteredRooms(sortedRooms);
        setPagination((prev) => ({
          ...prev,
          page: 1,
          total: response.data.meta?.total || 0,
          totalPages: response.data.meta?.totalPages || 1,
        }));
        message.success(`Tìm thấy ${sortedRooms.length} phòng phù hợp`, 2);
      } else {
        throw new Error(
          response.data.message || "Không tìm thấy phòng phù hợp"
        );
      }
    } catch (error: any) {
      const errorMsg = Array.isArray(error.response?.data?.message)
        ? error.response.data.message.join("; ")
        : error.response?.data?.message || error.message;
      setError(`Lỗi khi tìm kiếm: ${errorMsg}`);
      message.error(errorMsg, 2);
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setSearchLoading(false);
    }
  }, [token, router, pagination.limit, searchParams]);

  const debouncedSearch = useMemo(
    () =>
      _.debounce(() => {
        handleSearch();
      }, 500),
    [handleSearch]
  );

  useEffect(() => {
    if (searchParams.keyword?.trim()) {
      debouncedSearch();
    } else {
      setFilteredRooms(rooms);
    }
    return () => debouncedSearch.cancel();
  }, [searchParams.keyword, rooms, debouncedSearch]);

  useEffect(() => {
    if (
      searchParams.location ||
      (searchParams.status && validStatuses.includes(searchParams.status)) ||
      searchParams.fromDate ||
      searchParams.toDate ||
      searchParams.minCapacity !== null ||
      searchParams.maxCapacity !== null ||
      searchParams.hasProjector ||
      searchParams.allowFood ||
      searchParams.features.length
    ) {
      debouncedSearch();
    }
  }, [
    searchParams.location,
    searchParams.status,
    searchParams.fromDate,
    searchParams.toDate,
    searchParams.minCapacity,
    searchParams.maxCapacity,
    searchParams.hasProjector,
    searchParams.allowFood,
    searchParams.features,
    debouncedSearch,
  ]);

  const handleSoftDelete = useCallback(
    async (id: string) => {
      const authToken = token || localStorage.getItem("access_token");
      if (!authToken) {
        setError("Vui lòng đăng nhập để xóa phòng.");
        message.error("Vui lòng đăng nhập để tiếp tục.", 2);
        router.push("/login");
        return;
      }

      if (!isAdmin) {
        message.error("Bạn không có quyền xóa phòng!", 2);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${NESTJS_API_URL}/api/rooms/${id}/soft-delete`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.data.success) {
          await fetchRooms();
          message.success("Phòng đã được xóa mềm thành công!", 2);
        } else {
          throw new Error(response.data.message || "Xóa phòng thất bại");
        }
      } catch (error: any) {
        const errorMsg = Array.isArray(error.response?.data?.message)
          ? error.response.data.message.join("; ")
          : error.response?.data?.message || error.message;
        setError(`Lỗi khi xóa phòng: ${errorMsg}`);
        message.error(errorMsg, 2);
      } finally {
        setLoading(false);
      }
    },
    [token, router, isAdmin, fetchRooms]
  );

  const handleRoomClick = useCallback(
    (id: string) => {
      router.push(`/admin/rooms/${id}`);
    },
    [router]
  );

  const handleViewBookings = useCallback(
    (id: string) => {
      router.push(`/bookings/${id}`);
    },
    [router]
  );

  const handlePageChange = useCallback((newPage: number, pageSize?: number) => {
    setPagination((prev) => ({
      ...prev,
      page: newPage,
      limit: pageSize || prev.limit,
    }));
  }, []);

  const handleResetSearch = useCallback(() => {
    setSearchParams({
      keyword: "",
      location: "",
      status: "",
      fromDate: null,
      toDate: null,
      minCapacity: null,
      maxCapacity: null,
      hasProjector: false,
      allowFood: false,
      features: [],
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
    setFilteredRooms(rooms);
    message.info("Đã đặt lại bộ lọc tìm kiếm", 2);
  }, [rooms]);

  const showAddModal = useCallback(() => {
    setIsAddModalVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsAddModalVisible(false);
  }, []);

  const handleUpdateClick = useCallback((room: Room) => {
    setSelectedRoom(room);
    setIsUpdateModalVisible(true);
  }, []);

  const handleUpdateModalClose = useCallback(() => {
    setIsUpdateModalVisible(false);
    setSelectedRoom(null);
  }, []);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    if (role) {
      fetchRooms();
    }
  }, [role, fetchRooms, pagination.page, pagination.limit]);

  const columns = [
    {
      title: "Tên phòng",
      dataIndex: "name",
      key: "name",
      render: (text: string) => (
        <Text
          style={{
            fontSize: "18px",
            color: "#1d39c4",
            transition: "color 0.3s",
          }}
        >
          {text}
        </Text>
      ),
    },
    {
      title: "Sức chứa",
      dataIndex: "capacity",
      key: "capacity",
      render: (capacity: number) => (
        <Text style={{ fontSize: "18px", color: "#595959" }}>
          {capacity} người
        </Text>
      ),
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      render: (text: string) => (
        <Text style={{ fontSize: "18px", color: "#595959" }}>{text}</Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      hidden: !isAdmin && searchParams.status === "deleted",
      render: (status: string) => (
        <Tag
          color={
            status === "available"
              ? "#52c41a"
              : status === "occupied"
                ? "#fa8c16"
                : status === "maintenance"
                  ? "#faad14"
                  : status === "deleted"
                    ? "#ff4d4f"
                    : status === "cleaning"
                      ? "#1890ff"
                      : "#722ed1"
          }
          style={{
            fontSize: "18px",
            padding: "8px 16px",
            borderRadius: "12px",
            transition: "all 0.3s",
          }}
        >
          {status === "available"
            ? "Sẵn sàng"
            : status === "occupied"
              ? "Đang sử dụng"
              : status === "maintenance"
                ? "Bảo trì"
                : status === "deleted"
                  ? "Đã xóa"
                  : status === "cleaning"
                    ? "Đang dọn dẹp"
                    : status}
        </Tag>
      ),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Room) => (
        <Space size={16}>
          <Button
            type="primary"
            icon={<CalendarOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewBookings(record._id);
            }}
            size="large"
            style={{
              borderRadius: "20px",
              background: "linear-gradient(90deg, #722ed1, #9254de)",
              border: "none",
              padding: "12px 24px",
              fontSize: "16px",
              color: "#ffffff",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(114, 46, 209, 0.3)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 6px 16px rgba(114, 46, 209, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow =
                "0 4px 12px rgba(114, 46, 209, 0.3)";
            }}
          >
            Xem lịch
          </Button>
          {isAdmin && (
            <>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateClick(record);
                }}
                size="large"
                style={{
                  borderRadius: "20px",
                  background: "linear-gradient(90deg, #1890ff, #40a9ff)",
                  border: "none",
                  padding: "12px 24px",
                  fontSize: "16px",
                  color: "#ffffff",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(24, 144, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(24, 144, 255, 0.3)";
                }}
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
                  borderRadius: "20px",
                  background: "linear-gradient(90deg, #ff4d4f, #ff7875)",
                  border: "none",
                  padding: "12px 24px",
                  fontSize: "16px",
                  color: "#ffffff",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(255, 77, 79, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 16px rgba(255, 77, 79, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 12px rgba(255, 77, 79, 0.3)";
                }}
              >
                Xóa
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ].filter((col) => !col.hidden);

  return (
    <div
      style={{
        padding: "24px",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f2f5, #e6f7ff)",
        overflow: "auto",
        position: "relative",
        color: "#1d39c4",
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
          100% {
            opacity: 1;
          }
        }
        .fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
      {loading ? (
        <Card
          styles={{
            body: {
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              border: "1px solid #1890ff",
              background: "#ffffff",
              textAlign: "center",
              padding: "40px",
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            },
          }}
        >
          <Spin size="large" style={{ marginBottom: "24px" }} />
          <Text
            style={{
              fontSize: "28px",
              color: "#1d39c4",
              fontWeight: 600,
              animation: "pulse 1.5s infinite",
            }}
          >
            Đang tải...
          </Text>
        </Card>
      ) : error ? (
        <Card
          styles={{
            body: {
              borderRadius: "16px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
              border: "1px solid #ff4d4f",
              textAlign: "center",
              width: "100%",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          }}
        >
          <Text
            type="danger"
            style={{ fontSize: "28px", fontWeight: 600, color: "#ff4d4f" }}
          >
            {error}
          </Text>
        </Card>
      ) : (
        <>
          <Title
            level={2}
            style={{
              color: "#1d39c4",
              textShadow: "2px 2px 4px rgba(0,0,0,0.1)",
              marginBottom: "32px",
              fontSize: "32px",
              fontWeight: 700,
              animation: "fadeIn 0.5s ease-out",
            }}
          >
            {isAdmin ? "Quản Lý Phòng Họp" : "Danh Sách Phòng Khả Dụng"}
          </Title>
          <Card
            styles={{
              body: {
                borderRadius: "16px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
                marginBottom: "32px",
                background: "#ffffff",
                padding: "24px",
                width: "100%",
                animation: "fadeIn 0.5s ease-out",
              },
            }}
          >
            <Space
              style={{
                marginBottom: showAdvancedSearch ? "32px" : "0",
                justifyContent: "space-between",
                width: "100%",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <Input
                placeholder="Tìm kiếm theo tên phòng"
                value={searchParams.keyword}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, keyword: e.target.value })
                }
                onPressEnter={handleSearch}
                prefix={<SearchOutlined />}
                suffix={searchLoading ? <Spin size="small" /> : null}
                style={{
                  width: showAdvancedSearch ? "60%" : "70%",
                  minWidth: "300px",
                  borderRadius: "20px",
                  border: "2px solid #ff6f61",
                  background: "linear-gradient(135deg, #fff5f5, #ffe7e6)",
                  boxShadow: "0 8px 24px rgba(255, 111, 97, 0.2)",
                  padding: "16px 32px",
                  fontSize: "18px",
                  color: "#1d39c4",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "2px solid #ff4d4f";
                  e.currentTarget.style.boxShadow =
                    "0 10px 28px rgba(255, 77, 79, 0.3)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "2px solid #ff6f61";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(255, 111, 97, 0.2)";
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
              <Space size={16}>
                <Button
                  type="primary"
                  icon={<SearchOutlined />}
                  onClick={handleSearch}
                  size="large"
                  loading={searchLoading}
                  style={{
                    borderRadius: "20px",
                    background: "linear-gradient(90deg, #1890ff, #40a9ff)",
                    border: "none",
                    padding: "12px 24px",
                    fontSize: "16px",
                    color: "#ffffff",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(24, 144, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(24, 144, 255, 0.3)";
                  }}
                >
                  Tìm kiếm
                </Button>
                <Button
                  onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                  size="large"
                  style={{
                    borderRadius: "20px",
                    background: "linear-gradient(90deg, #ff4d4f, #ff7875)",
                    border: "none",
                    color: "#ffffff",
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(255, 77, 79, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(255, 77, 79, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(255, 77, 79, 0.3)";
                  }}
                >
                  {showAdvancedSearch ? (
                    <>
                      <UpOutlined /> Ẩn
                    </>
                  ) : (
                    <>
                      <DownOutlined /> Chi tiết
                    </>
                  )}
                </Button>
                <Button
                  type="default"
                  onClick={handleResetSearch}
                  size="large"
                  style={{
                    borderRadius: "20px",
                    background: "linear-gradient(90deg, #1890ff, #40a9ff)",
                    border: "none",
                    color: "#ffffff",
                    padding: "12px 24px",
                    fontSize: "16px",
                    fontWeight: 500,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(24, 144, 255, 0.3)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(24, 144, 255, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(24, 144, 255, 0.3)";
                  }}
                >
                  Đặt lại
                </Button>
                {isAdmin && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={showAddModal}
                    size="large"
                    style={{
                      borderRadius: "20px",
                      background: "linear-gradient(90deg, #52c41a, #73d13d)",
                      border: "none",
                      color: "#ffffff",
                      padding: "12px 24px",
                      fontSize: "16px",
                      fontWeight: 500,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 12px rgba(82, 196, 26, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow =
                        "0 6px 16px rgba(82, 196, 26, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 12px rgba(82, 196, 26, 0.3)";
                    }}
                  >
                    Tạo phòng
                  </Button>
                )}
              </Space>
            </Space>
            {showAdvancedSearch && (
              <Space
                direction="vertical"
                size="large"
                style={{
                  width: "100%",
                  marginTop: "32px",
                  animation: "fadeIn 0.5s ease-out",
                }}
              >
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Vị trí:
                    </Text>
                    <Select
                      placeholder="Chọn vị trí"
                      value={searchParams.location || undefined}
                      onChange={(value) =>
                        setSearchParams({
                          ...searchParams,
                          location: value || "",
                        })
                      }
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      allowClear
                    >
                      <Option value="phòng 1901 - tầng 19 - 19 Tố Hữu">
                        Phòng 1901 - Tầng 19
                      </Option>
                      <Option value="phòng 1902 - tầng 19 - 19 Tố Hữu">
                        Phòng 1902 - Tầng 19
                      </Option>
                      <Option value="tầng 1704 - tầng 17 - 19 Tố Hữu">
                        Tầng 1704 - Tầng 17
                      </Option>
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Trạng thái:
                    </Text>
                    <Select
                      placeholder="Chọn trạng thái"
                      value={searchParams.status || undefined}
                      onChange={(value) =>
                        setSearchParams({
                          ...searchParams,
                          status: value || "",
                        })
                      }
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      allowClear
                    >
                      <Option value="available">Sẵn sàng</Option>
                      <Option value="occupied">Đang sử dụng</Option>
                      <Option value="maintenance">Bảo trì</Option>
                      <Option value="cleaning">Đang dọn dẹp</Option>
                      {isAdmin && <Option value="deleted">Đã xóa</Option>}
                    </Select>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Tính năng:
                    </Text>
                    <Select
                      mode="multiple"
                      placeholder="Chọn tính năng (ví dụ: Wi-Fi, Máy chiếu)"
                      value={searchParams.features}
                      onChange={(value) =>
                        setSearchParams({ ...searchParams, features: value })
                      }
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      options={[
                        { value: "Wi-Fi", label: "Wi-Fi" },
                        { value: "Máy chiếu", label: "Máy chiếu" },
                        { value: "Loa", label: "Loa" },
                        { value: "Bảng trắng", label: "Bảng trắng" },
                      ]}
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Từ ngày:
                    </Text>
                    <DatePicker
                      value={searchParams.fromDate}
                      onChange={(date) =>
                        setSearchParams({ ...searchParams, fromDate: date })
                      }
                      format="DD/MM/YYYY"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      placeholder="Chọn ngày bắt đầu"
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Đến ngày:
                    </Text>
                    <DatePicker
                      value={searchParams.toDate}
                      onChange={(date) =>
                        setSearchParams({ ...searchParams, toDate: date })
                      }
                      format="DD/MM/YYYY"
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      placeholder="Chọn ngày kết thúc"
                      disabledDate={(current) =>
                        current &&
                        searchParams.fromDate &&
                        current < searchParams.fromDate
                      }
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Sức chứa tối thiểu:
                    </Text>
                    <InputNumber
                      min={1}
                      value={searchParams.minCapacity}
                      onChange={(value) =>
                        setSearchParams({ ...searchParams, minCapacity: value })
                      }
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      placeholder="Nhập sức chứa tối thiểu"
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Text
                      strong
                      style={{
                        color: "#1d39c4",
                        fontSize: "18px",
                        marginBottom: "8px",
                      }}
                    >
                      Sức chứa tối đa:
                    </Text>
                    <InputNumber
                      min={searchParams.minCapacity || 1}
                      value={searchParams.maxCapacity}
                      onChange={(value) =>
                        setSearchParams({ ...searchParams, maxCapacity: value })
                      }
                      style={{
                        width: "100%",
                        borderRadius: "12px",
                        fontSize: "16px",
                        transition: "all 0.3s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                      placeholder="Nhập sức chứa tối đa"
                    />
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox
                      checked={searchParams.hasProjector}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          hasProjector: e.target.checked,
                        })
                      }
                      style={{ fontSize: "16px", marginBottom: "8px" }}
                    >
                      <Text style={{ color: "#1d39c4", fontSize: "16px" }}>
                        Có máy chiếu
                      </Text>
                    </Checkbox>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Checkbox
                      checked={searchParams.allowFood}
                      onChange={(e) =>
                        setSearchParams({
                          ...searchParams,
                          allowFood: e.target.checked,
                        })
                      }
                      style={{ fontSize: "16px", marginBottom: "8px" }}
                    >
                      <Text style={{ color: "#1d39c4", fontSize: "16px" }}>
                        Cho phép đồ ăn
                      </Text>
                    </Checkbox>
                  </Col>
                </Row>
              </Space>
            )}
          </Card>
          <Table
            className="fade-in"
            columns={columns}
            dataSource={filteredRooms}
            rowKey="_id"
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              onChange: handlePageChange,
              onShowSizeChange: handlePageChange,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              style: { marginTop: "16px" },
            }}
            style={{ marginTop: "32px" }}
            onRow={(record) => ({
              onClick: () => handleRoomClick(record._id),
              style: {
                cursor: "pointer",
                transition: "background-color 0.3s",
              },
              onMouseEnter: (e) => {
                e.currentTarget.style.backgroundColor = "#e6f7ff";
              },
              onMouseLeave: (e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              },
            })}
            scroll={{ x: "max-content" }}
            locale={{
              emptyText: (
                <Text style={{ fontSize: "18px", color: "#1d39c4" }}>
                  Không tìm thấy phòng phù hợp
                </Text>
              ),
            }}
          />
        </>
      )}
      <Modal
        title="Thêm phòng mới"
        open={isAddModalVisible}
        onCancel={handleModalClose}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: "1200px" }}
      >
        <AddRoom />
      </Modal>
      <Modal
        title="Sửa thông tin phòng"
        open={isUpdateModalVisible}
        onCancel={handleUpdateModalClose}
        footer={null}
        width="90vw"
        style={{ top: 20, maxWidth: "1200px" }}
      >
        <UpdateRoom
          room={selectedRoom}
          onClose={handleUpdateModalClose}
          fetchRooms={fetchRooms}
        />
      </Modal>
    </div>
  );
};

export default RoomList;
