import { 
  IsString, 
  IsNumber, 
  IsArray, 
  ValidateNested, 
  IsIn, 
  IsOptional,
  IsBoolean
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
  capacity?: number;
  
  @IsString()
  @IsIn(['Tòa A - Tầng 1', 'Tòa A - Tầng 2', 'Tòa B - Tầng 3'])
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