"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@web/store/user.store";
import axios from "axios";
import {
  message,
  Card,
  Typography,
  Button,
  Row,
  Col,
  List,
  Tag,
  Space,
} from "antd";
import { ArrowLeftOutlined, StarFilled } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

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
  allowFood: boolean;
  bookingCount: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const fieldStyles = [
  {
    bg: "linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)",
    border: "#1890ff",
    hoverBg: "#bae7ff",
    hoverText: "#1d39c4",
  },
  {
    bg: "linear-gradient(135deg, #fff0f6 0%, #ffadd2 100%)",
    border: "#eb2f96",
    hoverBg: "#ffadd2",
    hoverText: "#9e1068",
  },
  {
    bg: "linear-gradient(135deg, #e6fffb 0%, #87e8de 100%)",
    border: "#13c2c2",
    hoverBg: "#87e8de",
    hoverText: "#08979c",
  },
  {
    bg: "linear-gradient(135deg, #fffbe6 0%, #fff1b8 100%)",
    border: "#fadb14",
    hoverBg: "#fff1b8",
    hoverText: "#d4a017",
  },
  {
    bg: "linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)",
    border: "#722ed1",
    hoverBg: "#d3adf7",
    hoverText: "#391085",
  },
  {
    bg: "linear-gradient(135deg, #fff2e8 0%, #ffd8bf 100%)",
    border: "#fa8c16",
    hoverBg: "#ffd8bf",
    hoverText: "#ad6800",
  },
];

const RoomDetail = () => {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUserStore();
  const NESTJS_API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchRoom = async () => {
      const authToken = token || localStorage.getItem("access_token");
      if (!authToken) {
        setError("Vui lòng đăng nhập để xem thông tin phòng.");
        message.error("Vui lòng đăng nhập để tiếp tục.");
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${NESTJS_API_URL}/api/rooms/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
        });

        if (response.data.success) {
          setRoom(response.data.data);
        } else {
          setError(response.data.message || "Không thể tải thông tin phòng");
          message.error(
            response.data.message || "Không thể tải thông tin phòng"
          );
        }
      } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        setError(`Lỗi khi tải thông tin phòng: ${errorMsg}`);
        message.error(errorMsg);
        if (error.response?.status === 401) {
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id, router, token]);

  const handleBack = () => {
    router.push("/rooms");
  };

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1200px",
        margin: "0 auto",
        background: "linear-gradient(135deg, #e6f7ff 0%, #f0f2f5 100%)",
        minHeight: "100vh",
      }}
    >
      {loading ? (
        <Card
          loading
          style={{
            borderRadius: "12px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            border: "2px solid #1890ff",
          }}
        />
      ) : error ? (
        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            border: "2px solid #ff4d4f",
          }}
        >
          <Text type="danger" style={{ fontSize: "16px", fontWeight: 500 }}>
            {error}
          </Text>
        </Card>
      ) : !room ? (
        <Card
          style={{
            borderRadius: "12px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            border: "2px solid #ff4d4f",
          }}
        >
          <Text style={{ fontSize: "16px", fontWeight: 500 }}>
            Không tìm thấy phòng
          </Text>
        </Card>
      ) : (
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                type="primary"
                style={{
                  borderRadius: "8px",
                  background: "linear-gradient(90deg, #1890ff, #40c4ff)",
                  border: "none",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "scale(1.05)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "scale(1)")
                }
              >
                Quay lại
              </Button>
              <Title
                level={3}
                style={{
                  margin: 0,
                  color: "#1d39c4",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.1)",
                }}
              >
                {room.name}
              </Title>
            </Space>
          }
          style={{
            borderRadius: "12px",
            boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
            border: "2px solid #1890ff",
            background: "linear-gradient(180deg, #ffffff, #f0faff)",
            overflow: "hidden",
            transition: "all 0.3s ease",
          }}
          bodyStyle={{ padding: "24px" }}
          hoverable
        >
          <Row gutter={[24, 24]}>
            <Col xs={24}>
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <Card
                  style={{
                    background: fieldStyles[0].bg,
                    border: `1px solid ${fieldStyles[0].border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = fieldStyles[0].hoverBg;
                    e.currentTarget.style.color = fieldStyles[0].hoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = fieldStyles[0].bg;
                    e.currentTarget.style.color = "#595959";
                  }}
                >
                  <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                    Sức chứa:{" "}
                  </Text>
                  <Text style={{ fontSize: "16px", color: "#595959" }}>
                    {room.capacity} người
                  </Text>
                </Card>
                <Card
                  style={{
                    background: fieldStyles[1].bg,
                    border: `1px solid ${fieldStyles[1].border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = fieldStyles[1].hoverBg;
                    e.currentTarget.style.color = fieldStyles[1].hoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = fieldStyles[1].bg;
                    e.currentTarget.style.color = "#595959";
                  }}
                >
                  <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                    Vị trí:{" "}
                  </Text>
                  <Text style={{ fontSize: "16px", color: "#595959" }}>
                    {room.location}
                  </Text>
                </Card>
                <Card
                  style={{
                    background: fieldStyles[2].bg,
                    border: `1px solid ${fieldStyles[2].border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = fieldStyles[2].hoverBg;
                    e.currentTarget.style.color = fieldStyles[2].hoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = fieldStyles[2].bg;
                    e.currentTarget.style.color = "#595959";
                  }}
                >
                  <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                    Trạng thái:{" "}
                  </Text>
                  <Tag
                    color={
                      room.status === "available"
                        ? "#52c41a"
                        : room.status === "occupied"
                          ? "#fa8c16"
                          : room.status === "maintenance"
                            ? "#faad14"
                            : "#722ed1"
                    }
                    style={{
                      fontSize: "14px",
                      padding: "6px 12px",
                      borderRadius: "12px",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  >
                    {room.status === "available"
                      ? "Sẵn sàng"
                      : room.status === "occupied"
                        ? "Đang sử dụng"
                        : room.status === "maintenance"
                          ? "Bảo trì"
                          : room.status}
                  </Tag>
                </Card>
                {room.description && (
                  <Card
                    style={{
                      background: fieldStyles[3].bg,
                      border: `1px solid ${fieldStyles[3].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[3].hoverBg;
                      e.currentTarget.style.color = fieldStyles[3].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[3].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Mô tả:{" "}
                    </Text>
                    <Paragraph
                      style={{
                        fontSize: "15px",
                        color: "#595959",
                        lineHeight: "1.6",
                      }}
                    >
                      {room.description}
                    </Paragraph>
                  </Card>
                )}
                {room.features && room.features.length > 0 && (
                  <Card
                    style={{
                      background: fieldStyles[4].bg,
                      border: `1px solid ${fieldStyles[4].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[4].hoverBg;
                      e.currentTarget.style.color = fieldStyles[4].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[4].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Tính năng:{" "}
                    </Text>
                    <div>
                      {room.features.map((feature, index) => (
                        <Tag
                          key={index}
                          color={
                            ["#1890ff", "#eb2f96", "#13c2c2", "#fadb14"][
                              index % 4
                            ]
                          }
                          style={{
                            margin: "4px",
                            fontSize: "14px",
                            padding: "6px 12px",
                            borderRadius: "12px",
                            transition: "all 0.3s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.transform = "scale(1.1)")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.transform = "scale(1)")
                          }
                        >
                          <StarFilled style={{ marginRight: "4px" }} />{" "}
                          {feature}
                        </Tag>
                      ))}
                    </div>
                  </Card>
                )}
                {room.devices && room.devices.length > 0 && (
                  <Card
                    style={{
                      background: fieldStyles[5].bg,
                      border: `1px solid ${fieldStyles[5].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[5].hoverBg;
                      e.currentTarget.style.color = fieldStyles[5].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[5].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Thiết bị:{" "}
                    </Text>
                    <List
                      dataSource={room.devices}
                      renderItem={(device) => (
                        <List.Item
                          style={{ fontSize: "15px", color: "#595959" }}
                        >
                          <Text>
                            {device.name}: {device.quantity}{" "}
                            {device.note && (
                              <Text type="secondary">({device.note})</Text>
                            )}
                          </Text>
                        </List.Item>
                      )}
                    />
                  </Card>
                )}
                {room.operatingHours && (
                  <Card
                    style={{
                      background: fieldStyles[0].bg,
                      border: `1px solid ${fieldStyles[0].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[0].hoverBg;
                      e.currentTarget.style.color = fieldStyles[0].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[0].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Giờ hoạt động:{" "}
                    </Text>
                    <div>
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Mở cửa: {room.operatingHours.open || "Không xác định"}
                      </Text>
                      <br />
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Đóng cửa:{" "}
                        {room.operatingHours.close || "Không xác định"}
                      </Text>
                      {room.operatingHours.closedDays &&
                        room.operatingHours.closedDays.length > 0 && (
                          <>
                            <br />
                            <Text
                              style={{ fontSize: "15px", color: "#595959" }}
                            >
                              Ngày đóng cửa:{" "}
                              {room.operatingHours.closedDays.join(", ")}
                            </Text>
                          </>
                        )}
                    </div>
                  </Card>
                )}
                {room.bookingPolicy && (
                  <Card
                    style={{
                      background: fieldStyles[1].bg,
                      border: `1px solid ${fieldStyles[1].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[1].hoverBg;
                      e.currentTarget.style.color = fieldStyles[1].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[1].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Chính sách đặt phòng:{" "}
                    </Text>
                    <div>
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Thời gian đặt tối thiểu:{" "}
                        {room.bookingPolicy.minBookingHours || "Không giới hạn"}{" "}
                        giờ
                      </Text>
                      <br />
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Thời gian đặt tối đa:{" "}
                        {room.bookingPolicy.maxBookingHours || "Không giới hạn"}{" "}
                        giờ
                      </Text>
                      <br />
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Thời gian đệm: {room.bookingPolicy.bufferTime || 0} phút
                      </Text>
                    </div>
                  </Card>
                )}
                {room.cancellationPolicy && (
                  <Card
                    style={{
                      background: fieldStyles[2].bg,
                      border: `1px solid ${fieldStyles[2].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[2].hoverBg;
                      e.currentTarget.style.color = fieldStyles[2].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[2].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Chính sách hủy:{" "}
                    </Text>
                    <div>
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Thông báo tối thiểu:{" "}
                        {room.cancellationPolicy.minNotice || 0} giờ
                      </Text>
                      <br />
                      <Text style={{ fontSize: "15px", color: "#595959" }}>
                        Phí hủy muộn:{" "}
                        {room.cancellationPolicy.lateCancelFee || 0} VND
                      </Text>
                    </div>
                  </Card>
                )}
                <Card
                  style={{
                    background: fieldStyles[3].bg,
                    border: `1px solid ${fieldStyles[3].border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = fieldStyles[3].hoverBg;
                    e.currentTarget.style.color = fieldStyles[3].hoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = fieldStyles[3].bg;
                    e.currentTarget.style.color = "#595959";
                  }}
                >
                  <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                    Cho phép đồ ăn:{" "}
                  </Text>
                  <Text style={{ fontSize: "15px", color: "#595959" }}>
                    {room.allowFood ? "Có" : "Không"}
                  </Text>
                </Card>
                <Card
                  style={{
                    background: fieldStyles[4].bg,
                    border: `1px solid ${fieldStyles[4].border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    transition: "all 0.3s ease",
                  }}
                  bodyStyle={{ padding: 0 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = fieldStyles[4].hoverBg;
                    e.currentTarget.style.color = fieldStyles[4].hoverText;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = fieldStyles[4].bg;
                    e.currentTarget.style.color = "#595959";
                  }}
                >
                  <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                    Số lần đặt:{" "}
                  </Text>
                  <Text style={{ fontSize: "15px", color: "#595959" }}>
                    {room.bookingCount}
                  </Text>
                </Card>
                {(room.createdAt || room.updatedAt) && (
                  <Card
                    style={{
                      background: fieldStyles[5].bg,
                      border: `1px solid ${fieldStyles[5].border}`,
                      borderRadius: "8px",
                      padding: "12px",
                      transition: "all 0.3s ease",
                    }}
                    bodyStyle={{ padding: 0 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = fieldStyles[5].hoverBg;
                      e.currentTarget.style.color = fieldStyles[5].hoverText;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = fieldStyles[5].bg;
                      e.currentTarget.style.color = "#595959";
                    }}
                  >
                    <Text strong style={{ color: "#1d39c4", fontSize: "16px" }}>
                      Thông tin cập nhật:{" "}
                    </Text>
                    <div>
                      {room.createdAt && (
                        <>
                          <Text style={{ fontSize: "15px", color: "#595959" }}>
                            Tạo lúc: {new Date(room.createdAt).toLocaleString()}
                          </Text>
                          <br />
                        </>
                      )}
                      {room.updatedAt && (
                        <Text style={{ fontSize: "15px", color: "#595959" }}>
                          Cập nhật lúc:{" "}
                          {new Date(room.updatedAt).toLocaleString()}
                        </Text>
                      )}
                    </div>
                  </Card>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      )}
    </div>
  );
};

export default RoomDetail;