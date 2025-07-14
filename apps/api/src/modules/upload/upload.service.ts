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
    try {
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
    } catch (error) {
      throw error;
    }
  }

  async uploadFileToChatFolder(file: Express.Multer.File): Promise<{ success: boolean; message: string; data: { savedFile: Image } | null }> {
    try {
      if (!file || !file.buffer) {
        return {
          success: false,
          message: 'File is required',
          data: null,
        };
      }
      const result: UploadApiResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: 'auto',
              folder: 'file-chat',
            },
            (error, result) => {
              if (error || !result) return reject(new Error(error?.message || 'Upload failed'));
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

      const savedFile = await image.save();

      return {
        success: true,
        message: 'Upload file thành công',
        data: { savedFile },
      };
    } catch {
      return {
        success: false,
        message: 'Upload file thất bại',
        data: null,
      };
    }
  }

  async deleteFileFromChatFolder(publicId: string): Promise<{ success: boolean; message: string }> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
      await this.imageModel.deleteOne({ public_id: publicId });
      return {
        success: true,
        message: 'Xóa file thành công',
      };
    } catch {
      return {
        success: false,
        message: 'Xóa file thất bại',
      };
    }
  }
}
