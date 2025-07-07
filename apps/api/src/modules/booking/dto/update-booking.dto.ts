import { PartialType } from '@nestjs/mapped-types';
import { CreateBookingDto } from './create-booking.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { BookingStatus } from '../booking.schema';

export class UpdateBookingDto extends PartialType(CreateBookingDto) {
    @IsOptional()
    @IsEnum(BookingStatus)
    status?: BookingStatus;
}