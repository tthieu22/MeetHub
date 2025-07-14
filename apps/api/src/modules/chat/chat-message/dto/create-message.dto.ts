import { IsString, IsOptional, IsArray, IsMongoId } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsMongoId()
  @IsOptional()
  replyTo?: string;

  @IsArray()
  @IsOptional()
  mentions?: string[];

  @IsOptional()
  fileData?: string;

  fileName?: string;
  fileType?: string;
}
