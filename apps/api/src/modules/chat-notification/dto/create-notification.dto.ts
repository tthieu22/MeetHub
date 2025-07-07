import { IsString, IsMongoId, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsEnum(['message', 'mention', 'reaction', 'room_update'])
  @IsOptional()
  type?: string;

  @IsMongoId()
  @IsOptional()
  messageId?: string;

  @IsMongoId()
  @IsOptional()
  roomId?: string;
}
