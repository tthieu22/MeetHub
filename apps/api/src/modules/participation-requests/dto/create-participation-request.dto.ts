import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateParticipationRequestDto {
  @IsNotEmpty({ message: 'Booking ID is required' })
  @IsString({ message: 'Booking ID must be a string' })
  @IsMongoId({ message: 'Booking ID must be a valid MongoDB ObjectId' })
  booking: string;

  @IsNotEmpty({ message: 'User ID is required' })
  @IsString({ message: 'User ID must be a string' })
  @IsMongoId({ message: 'User ID must be a valid MongoDB ObjectId' })
  user: string;
}