import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
export enum VerifyCodeType {
  VERIFY_ACCOUNT = 'verify_account',
  RESET_PASSWORD = 'reset_password',
}

@Schema()
export class VerifyCode extends Document {
  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  code: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: String, enum: ['verify_account', 'reset_password'] })
  type: string;
}

export const VerifyCodeSchema = SchemaFactory.createForClass(VerifyCode);

// Tự động xóa document sau 5 phút
VerifyCodeSchema.index({ createdAt: 1 }, { expireAfterSeconds: 300 });
