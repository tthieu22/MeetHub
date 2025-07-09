import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Image, ImageSchema } from './schema/image.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Image.name, schema: ImageSchema }])],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadImageModule {}
