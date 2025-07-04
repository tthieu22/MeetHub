import { IsMongoId } from 'class-validator';

export class ReadMessageDto {
  @IsMongoId()
  messageId: string;

  @IsMongoId()
  userId: string;
}
