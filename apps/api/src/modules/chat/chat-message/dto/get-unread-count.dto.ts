import { IsString } from 'class-validator';

export class GetUnreadCountDto {
  @IsString()
  roomId: string;
}
