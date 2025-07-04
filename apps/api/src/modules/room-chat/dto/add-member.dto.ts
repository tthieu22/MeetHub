import { IsMongoId } from 'class-validator';

export class AddMemberDto {
  @IsMongoId()
  userId: string;
}
