import { IsString, IsMongoId } from 'class-validator';

export class UploadFileDto {
  @IsMongoId()
  id: string;

  @IsString()
  userId: string;
}
