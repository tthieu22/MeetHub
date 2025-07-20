export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  DELETED = 'deleted'
}

export const BOOKING_STATUS_OPTIONS = [
  { value: BookingStatus.PENDING, label: 'Đang chờ' },
  { value: BookingStatus.CONFIRMED, label: 'Đã xác nhận' },
  { value: BookingStatus.CANCELLED, label: 'Đã hủy' },
  { value: BookingStatus.COMPLETED, label: 'Đã hoàn thành' },
  { value: BookingStatus.DELETED, label: 'Đã xóa' }
];