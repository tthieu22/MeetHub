import { IsString, IsNotEmpty } from 'class-validator';

export class CreateReactionDto {
  @IsString()
  @IsNotEmpty()
  emoji: string;
}
