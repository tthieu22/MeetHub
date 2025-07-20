'use client';

import { Table, Tag, Space, Button, Popconfirm } from 'antd';
import { BookingItem } from './types';
import { ColumnsType } from 'antd/es/table';

interface TableBookingProps {
  data: BookingItem[];
  loading: boolean;
  pagination: any;
  onPageChange: (page: number, pageSize?: number) => void;
  onShowDetail: (booking: BookingItem) => void;
  onEdit: (booking: BookingItem) => void;
  onCancel: (booking: BookingItem) => void;
}

const statusColorMap: Record<string, string> = {
  pending: 'magenta',
  confirmed: 'blue',
  cancelled: 'orange',
  completed: 'green',
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
  const columns: ColumnsType<BookingItem> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      render: (text) => text || 'Không có tiêu đề',
    },
    {
      title: 'Phòng',
      dataIndex: ['room', 'name'],
      key: 'room',
    },
    {
      title: 'Người đặt',
      dataIndex: ['user', 'name'],
      key: 'user',
    },
    {
      title: 'Thời gian',
      key: 'time',
      render: (_, record) => (
        <span>
          {new Date(record.startTime).toLocaleString()} -{' '}
          {new Date(record.endTime).toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusColorMap[status] || 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => onShowDetail(record)}>
            Xem
          </Button>
          <Button type="link" onClick={() => onEdit(record)}>
            Sửa
          </Button>
          {record.status !== 'cancelled' && (
            <Popconfirm
              title="Bạn chắc chắn muốn hủy booking này?"
              onConfirm={() => onCancel(record)}
              okText="Đồng ý"
              cancelText="Hủy"
            >
              <Button type="link" danger>
                Hủy
              </Button>
            </Popconfirm>
          )}
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
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total,
        showSizeChanger: true,
        onChange: onPageChange,
      }}
    />
  );
};

export default TableBooking;

export interface BookingItem {
  _id: string;
  title: string;
  description: string;
  room: {
    _id: string;
    name: string;
  };
  user: {
    _id: string;
    name: string;
  };
  participants: Array<{
    _id: string;
    name: string;
  }>;
  startTime: string;
  endTime: string;
  status: string;
}