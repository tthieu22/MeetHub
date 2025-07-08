import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class VerifyCode extends Document {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;
}

export const VerifyCodeSchema = SchemaFactory.createForClass(VerifyCode);

// Tự động xóa document sau 5 phút
VerifyCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
