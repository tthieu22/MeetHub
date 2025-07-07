import { IsString, IsMongoId, IsNotEmpty } from 'class-validator';

export class ReactionDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  emoji: string;
}
