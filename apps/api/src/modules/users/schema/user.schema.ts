import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type UserDocument = User & Document;
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}
@Schema({ timestamps: true })
export class User {
  @Prop()
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    type: String,
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop()
  avatarURL: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}
export const UserSchema = SchemaFactory.createForClass(User);
