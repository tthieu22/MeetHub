import { IsArray, IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBookingDto {
    @IsNotEmpty()
    @IsString()
    room: string;

    @IsNotEmpty()
    @IsString()
    user: string; // Thêm thuộc tính user

    @IsNotEmpty()
    @IsDateString()
    startTime: Date;

    @IsNotEmpty()
    @IsDateString()
    endTime: Date;

    @IsArray()
    @IsString({ each: true })
    participants: string[];

    @IsString()
    @IsOptional()
    title?: string;

    @IsString()
    @IsOptional()
    description?: string;
}