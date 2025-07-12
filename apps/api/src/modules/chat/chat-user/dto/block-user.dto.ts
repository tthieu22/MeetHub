import { IsMongoId, IsNotEmpty } from 'class-validator';

export class BlockUserDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
