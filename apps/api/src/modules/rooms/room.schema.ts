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

  @Prop([{ name: String, quantity: Number, note: String }])
  devices: { name: string; quantity: number; note: string }[];

  @Prop({ type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' })
  status: string;

  @Prop([String])
  features: string[];

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const RoomSchema = SchemaFactory.createForClass(Room);