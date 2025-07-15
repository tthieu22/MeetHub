import {
  IsString,
  IsNumber,
  IsArray,
  IsIn,
  IsOptional,
  Min,
  IsBoolean,
  IsObject,
  ValidateNested,
  IsNotEmpty,
  Validate,
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
  @IsNotEmpty({ message: 'Tên phòng không được để trống' })
  name?: string;

  @IsNumber()
  @Min(6, { message: 'Sức chứa phải lớn hơn 5 người' })
  @IsNotEmpty({ message: 'Sức chứa phòng không  được để trống' })
  capacity?: number;

  @IsString()
  // @IsIn(['phòng 1901 - tầng 19 - 19 Tố Hữu', 'phòng 1902 - tầng 19 - 19 Tố Hữu', 'tầng 1704 - tầng 17 - 19 Tố Hữu'])
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
  @IsIn(['available', 'occupied', 'maintenance', 'cleaning', "Deleted"])
  @IsNotEmpty({ message: 'trạng thái hoạt động chưa được định nghĩa' })
  status?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}