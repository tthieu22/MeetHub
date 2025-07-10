import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Booking } from '@api/modules/booking/booking.schema';
import { User } from '@api/modules/users/schema/user.schema';

export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  DELETED = 'deleted'
}

@Schema({ timestamps: true })
export class ParticipationRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true })
  booking: Booking;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ 
    type: String, 
    enum: Object.values(RequestStatus),
    default: RequestStatus.PENDING
  })
  status: RequestStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: User;
}

export const ParticipationRequestSchema = SchemaFactory.createForClass(ParticipationRequest);