import { IsString } from 'class-validator';

export class MarkRoomReadDto {
  @IsString()
  roomId: string;
}
