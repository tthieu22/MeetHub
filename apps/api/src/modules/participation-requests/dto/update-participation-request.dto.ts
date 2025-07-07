import { PartialType } from '@nestjs/mapped-types';
import { CreateParticipationRequestDto } from './create-participation-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '../schemas/participation-request.schema';

export class UpdateParticipationRequestDto extends PartialType(CreateParticipationRequestDto) {
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  approvedBy?: string;
}