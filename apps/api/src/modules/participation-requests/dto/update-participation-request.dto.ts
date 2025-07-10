import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString, IsMongoId } from 'class-validator';
import { CreateParticipationRequestDto } from './create-participation-request.dto';
import { RequestStatus } from '../schemas/participation-request.schema';

export class UpdateParticipationRequestDto extends PartialType(CreateParticipationRequestDto) {
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Trạng thái phải là một trong: PENDING, ACCEPTED, REJECTED' })
  status?: RequestStatus;

  @IsOptional()
  @IsString({ message: 'ApprovedBy phải là chuỗi' })
  @IsMongoId({ message: 'ApprovedBy phải là ObjectId hợp lệ của MongoDB' })
  approvedBy?: string;
}