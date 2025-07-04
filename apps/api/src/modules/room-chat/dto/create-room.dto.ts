import { IsString, IsArray, IsOptional, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsMongoId({ each: true })
  members: string[];
}
