import { IsString, IsMongoId } from 'class-validator';

export class DeleteMessageDto {
  @IsMongoId()
  id: string;

  @IsString()
  userId: string;
}
