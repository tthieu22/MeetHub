import { IsString, IsOptional, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMessagesDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @IsOptional()
  @IsDateString()
  before?: string;
}
