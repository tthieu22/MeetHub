import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AddMemberDto {
  @IsMongoId()
  @IsNotEmpty()
  userId: string;
}
