import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const cloudinaryProvider = {
  provide: 'CLOUDINARY',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.get<string>('CLOUD_NAME'),
      api_key: configService.get<string>('API_KEY_CLOUD'),
      api_secret: configService.get<string>('API_KEY_CLOUD_SECR'),
    });
    return cloudinary;
  },
};

export { cloudinary };
