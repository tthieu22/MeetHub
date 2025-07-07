import { IsMongoId } from 'class-validator';

export class UploadFileDto {
  @IsMongoId()
  messageId: string;
}
