import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Room extends Document {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  capacity: number;

  @Prop({ required: true, enum: ['tầng 19 - 19 Tố Hữu', 'tầng 17 - 19 Tố Hữu'] })
  location: string;

  @Prop()
  description: string;

  @Prop([{ 
    name: String, 
    quantity: Number, 
    note: String,
    canBeRemoved: { type: Boolean, default: false } // Thiết bị có thể mang ra ngoài
  }])
  devices: { 
    name: string; 
    quantity: number; 
    note?: string;
    canBeRemoved?: boolean;
  }[];

  @Prop({ 
    type: String, 
    enum: ['available', 'occupied', 'maintenance', 'cleaning'], // Thêm trạng thái dọn dẹp
    default: 'available'
  })
  status: string;

  @Prop([String])
  features: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  // Bổ sung các trường mới
  @Prop({ 
    type: {
      open: { type: String, default: '08:00' },
      close: { type: String, default: '18:00' },
      closedDays: [{ type: String, enum: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] }]
    },
    default: {}
  })
  operatingHours: {
    open: string;
    close: string;
    closedDays: string[];
  };

  @Prop({ 
    type: {
      minBookingHours: { type: Number, default: 1 },
      maxBookingHours: { type: Number, default: 4 },
      bufferTime: { type: Number, default: 15 } // Thời gian chuẩn bị (phút)
    },
    default: {}
  })
  bookingPolicy: {
    minBookingHours: number;
    maxBookingHours: number;
    bufferTime: number;
  };

  @Prop({ 
    type: {
      minNotice: { type: Number, default: 2 }, // Thời báo tối thiểu trước khi hủy (giờ)
      lateCancelFee: { type: Number, default: 0 } // Phí hủy muộn
    },
    default: {}
  })
  cancellationPolicy: {
    minNotice: number;
    lateCancelFee: number;
  };

  @Prop([String])
  images: string[]; // URL hình ảnh phòng

  @Prop({ type: Boolean, default: false })
  allowFood: boolean; // Cho phép ăn uống trong phòng

  @Prop({ type: Number, default: 0 })
  bookingCount: number; // Số lần đặt phòng (dùng cho thống kê)
}

export const RoomSchema = SchemaFactory.createForClass(Room);