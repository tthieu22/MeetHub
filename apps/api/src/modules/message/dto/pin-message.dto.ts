import { IsBoolean } from 'class-validator';

export class PinMessageDto {
  @IsBoolean()
  isPinned: boolean;
}
