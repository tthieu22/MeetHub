import { 
  IsArray, 
  IsDateString, 
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsMongoId,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsNumber
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../booking.schema';

export class CreateBookingDto {
  @IsNotEmpty()
  @IsMongoId()
  room: string;

  @IsNotEmpty()
  @IsMongoId()
  user: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: Date;

  @IsNotEmpty()
  @IsDateString()
  endTime: Date;

  @IsArray()
  @IsMongoId({ each: true })
  participants: string[];

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}