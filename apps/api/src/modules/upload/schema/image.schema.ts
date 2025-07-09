import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Image extends Document {
  @Prop({ required: true })
  public_id: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  format: string;

  @Prop()
  resource_type: string;
}

export const ImageSchema = SchemaFactory.createForClass(Image);
