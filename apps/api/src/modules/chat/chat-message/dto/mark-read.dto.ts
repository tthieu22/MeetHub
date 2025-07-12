import { IsString, IsMongoId } from 'class-validator';

export class MarkReadDto {
  @IsMongoId()
  id: string;

  @IsString()
  userId: string;
}
