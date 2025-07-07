import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
  IsOptional,
  IsBoolean,
  Min
} from 'class-validator';
import { Type } from 'class-transformer';

class DeviceDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  @Min(2, { message: 'Sức chứa phải lớn hơn 5 người' })
  capacity?: number;

  @IsString()
  @IsIn(['tầng 19 - 19 Tố Hữu', 'tầng 17 - 19 Tố Hữu']) // Khớp với schema
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceDto)
  @IsOptional()
  devices?: DeviceDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @IsString()
  @IsIn(['available', 'occupied', 'maintenance'])
  @IsOptional()
  status?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}