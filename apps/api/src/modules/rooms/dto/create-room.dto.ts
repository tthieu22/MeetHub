import {
  IsString,
  IsNumber,
  IsArray,
  IsIn,
  IsOptional,
  Min,
  IsBoolean,
  IsObject,
  ValidateNested as ValidateNestedDto,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';

class DeviceDto {
  @IsString()
  name: string;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;

  @IsBoolean()
  @IsOptional()
  canBeRemoved?: boolean;
}

class OperatingHoursDto {
  @IsString()
  @IsOptional()
  open?: string;

  @IsString()
  @IsOptional()
  close?: string;

  @IsArray()
  @IsString({ each: true })
  @IsIn(['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'], { each: true })
  @IsOptional()
  closedDays?: string[];
}

class BookingPolicyDto {
  @IsNumber()
  @Min(0.5)
  @IsOptional()
  minBookingHours?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  maxBookingHours?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bufferTime?: number;
}

class CancellationPolicyDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  minNotice?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  lateCancelFee?: number;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  name: string;

  @IsNumber()
  @Min(6, { message: 'Sức chứa phải lớn hơn 5 người' })
  @IsNotEmpty({ message: 'Sức chứa phòng không  được để trống' })
  capacity: number;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNestedDto({ each: true })
  @Type(() => DeviceDto)
  @IsOptional()
  devices?: DeviceDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsString()
  @IsIn(['available', 'occupied', 'maintenance', 'cleaning', 'deleted'])
  @IsOptional()
  status?: string;

  @IsObject()
  @ValidateNestedDto()
  @Type(() => OperatingHoursDto)
  @IsOptional()
  operatingHours?: OperatingHoursDto;

  @IsObject()
  @ValidateNestedDto()
  @Type(() => BookingPolicyDto)
  @IsOptional()
  bookingPolicy?: BookingPolicyDto;

  @IsObject()
  @ValidateNestedDto()
  @Type(() => CancellationPolicyDto)
  @IsOptional()
  cancellationPolicy?: CancellationPolicyDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsBoolean()
  @IsOptional()
  allowFood?: boolean;
}