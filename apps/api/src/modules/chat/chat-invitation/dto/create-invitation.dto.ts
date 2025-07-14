import { IsString, IsOptional, IsMongoId } from 'class-validator';

export class CreateInvitationDto {
  @IsMongoId()
  receiverId: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class RespondToInvitationDto {
  @IsString()
  action: 'accept' | 'decline';
}
