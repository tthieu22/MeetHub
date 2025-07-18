import React from "react";
import { Table, Tag, Avatar, Space, Button, Tooltip, Popconfirm } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

export interface BookingUser {
  _id: string;
  name: string;
  email: string;
  avatarURL?: string;
}

export interface BookingRoom {
  _id: string;
  name: string;
}

export interface BookingParticipant {
  _id: string;
  name: string;
  email: string;
}

export interface BookingItem {
  _id: string;
  title: string;
  room: BookingRoom | null;
  user: BookingUser;
  startTime: string;
  endTime: string;
  status: string;
  participants: BookingParticipant[];
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TableBookingProps {
  data: BookingItem[];
  loading?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange?: (page: number, pageSize?: number) => void;
  onShowDetail?: (booking: BookingItem) => void;
  onEdit?: (booking: BookingItem) => void;
  onCancel?: (booking: BookingItem) => void;
}

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "orange";
    case "confirmed":
      return "green";
    case "cancelled":
      return "red";
    case "completed":
      return "blue";
    case "deleted":
      return "default";
    default:
      return "default";
  }
};

const TableBooking: React.FC<TableBookingProps> = ({
  data,
  loading,
  pagination,
  onPageChange,
  onShowDetail,
  onEdit,
  onCancel,
}) => {
  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      width: 60,
      align: "center" as const,
      render: (_: any, __: any, i: number) =>
        pagination && pagination.current
          ? (pagination.current - 1) * (pagination.pageSize || 10) + i + 1
          : i + 1,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      key: "title",
      render: (text: string) => <b>{text}</b>,
    },
    {
      title: "Phòng",
      dataIndex: "room",
      key: "room",
      render: (room: BookingRoom | null) =>
        room?.name ? (
          <span>{room.name}</span>
        ) : (
          <i style={{ color: "#aaa" }}>Không xác định</i>
        ),
    },
    {
      title: "Người đặt",
      dataIndex: "user",
      key: "user",
      render: (user: BookingUser) => (
        <Space>
          <Avatar src={user.avatarURL} size={28} />
          <div>
            <div>{user.name}</div>
            <div style={{ fontSize: 12, color: "#888" }}>{user.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_: any, record: BookingItem) => (
        <div style={{ minWidth: 140 }}>
          <span>{dayjs(record.startTime).format("HH:mm DD/MM/YYYY")}</span>
          <br />
          <ArrowRightOutlined style={{ fontSize: 10, color: "#aaa" }} />
          <br />
          <span>{dayjs(record.endTime).format("HH:mm DD/MM/YYYY")}</span>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          color={statusColor(status)}
          style={{ fontWeight: 500, fontSize: 13 }}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Tag>
      ),
    },
    {
      title: "Người tham gia",
      dataIndex: "participants",
      key: "participants",
      render: (participants: BookingParticipant[]) => (
        <Tooltip
          title={
            participants.length
              ? participants.map((p) => `${p.name} (${p.email})`).join(", ")
              : "Không có người tham gia"
          }
        >
          <span style={{ fontWeight: 500 }}>{participants.length}</span>
        </Tooltip>
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 180,
      render: (_: any, record: BookingItem) => (
        <Space>
          <Button size="small" onClick={() => onShowDetail?.(record)}>
            Chi tiết
          </Button>
          <Button size="small" type="primary" onClick={() => onEdit?.(record)}>
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận huỷ"
            description="Bạn chắc chắn muốn huỷ?"
            onConfirm={() => onCancel?.(record)}
            okText="Có"
            cancelText="Không"
          >
            <Button size="small" danger>
              Hủy
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="_id"
      loading={loading}
      pagination={
        pagination
          ? {
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              onChange: onPageChange,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
            }
          : false
      }
      scroll={{ x: "max-content" }}
    />
  );
};

export default TableBooking;
