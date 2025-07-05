import { IsString, IsNumber, IsArray, ValidateNested, IsIn, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

class DeviceDto {
  @IsString()
  name: string;
  
  @IsNumber()
  quantity: number;
  
  @IsString()
  @IsOptional()
  note?: string;
}

export class CreateRoomDto {
  @IsString()
  name: string;
  
  @IsNumber()
  @Min(6, { message: 'Sức chứa phải lớn hơn 5 người' })
  capacity: number;
  
  @IsString()
  @IsIn(['tầng 19 - 19 Tố Hữu' , 'tầng 17 - 19 Tố Hữu'])
  location: string;
  
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
}