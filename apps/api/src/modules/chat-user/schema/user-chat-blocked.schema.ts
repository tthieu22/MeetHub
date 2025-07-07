import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class BlockedUsers {
  @Prop({ required: true })
  _id: Types.ObjectId;

  @Prop({ required: true, ref: 'User' })
  blockerId: Types.ObjectId;

  @Prop({ required: true, ref: 'User' })
  blockedId: Types.ObjectId;

  @Prop({ required: true, default: Date.now })
  blockedAt: Date;
}

export type BlockedUsersDocument = BlockedUsers & Document;
