// src/app/components/booking/constants.ts
export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  DELETED = 'deleted'
}

export const BOOKING_STATUS_OPTIONS = [
  { value: BookingStatus.PENDING, label: 'Đang chờ' },
  { value: BookingStatus.CONFIRMED, label: 'Đã xác nhận' },
  { value: BookingStatus.CANCELLED, label: 'Đã hủy' }
];