import { Booking } from '@api/modules/booking/booking.schema';
import { User } from '@api/modules/users/schema/user.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
export enum Type {
  BOOOKING = 'booking',
  CANCEL = 'cancel',
  REMINDER = 'reminder',
  CHAT = 'chat',
  SYSTEM = 'system',
}

export type NotificationDocument = Notification & Document;
@Schema({ timestamps: true })
export class Notification {
  @Prop({
    type: Types.ObjectId,
    ref: 'user',
    required: true,
  })
  receiverId: User;

  @Prop({
    type: String,
    enum: Type,
    required: true,
  })
  type: string;

  @Prop()
  title: string;

  @Prop()
  content: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'booking',
  })
  relatedBooking: Booking;

  @Prop({
    type: Boolean,

    default: true,
  })
  isRead: boolean;

  @Prop()
  priority: number;
}
export const NotificationSchema = SchemaFactory.createForClass(Notification);
