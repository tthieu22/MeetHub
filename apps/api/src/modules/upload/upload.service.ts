import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { cloudinary } from './cloudinary.provider';
import { Model } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import { Image } from './schema/image.schema';
import { Express } from 'express';
import { Multer } from 'multer';

@Injectable()
export class UploadService {
  constructor(@InjectModel(Image.name) private imageModel: Model<Image>) {}
  async uploadImage(file: Express.Multer.File): Promise<{ success: boolean; data: { savedImage: Image } }> {
    const result: UploadApiResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            resource_type: 'auto',
            folder: 'uploads',
          },
          (error, result) => {
            if (error || !result) return reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });

    // Lưu metadata vào MongoDB
    const image = new this.imageModel({
      public_id: result.public_id,
      url: result.secure_url,
      format: result.format,
      resource_type: result.resource_type,
    });

    const savedImage = await image.save();

    return {
      success: true,
      data: {
        savedImage,
      },
    };
  }
}
