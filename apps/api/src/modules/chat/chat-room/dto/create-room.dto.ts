import { IsString, IsArray, IsOptional, IsMongoId, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsEnum(['private', 'group'])
  type: string;

  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  members?: string[];
}
