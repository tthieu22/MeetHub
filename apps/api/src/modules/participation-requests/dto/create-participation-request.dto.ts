import { IsNotEmpty, IsString } from 'class-validator';

export class CreateParticipationRequestDto {
  @IsNotEmpty()
  @IsString()
  booking: string;

  @IsNotEmpty()
  @IsString()
  user: string;
}