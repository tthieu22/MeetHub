import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { RequestStatus } from '../schemas/participation-request.schema';

export class SearchParticipationRequestsDto {
  @IsOptional()
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Giới hạn bản ghi phải là số nguyên' })
  @Min(1, { message: 'Giới hạn bản ghi phải lớn hơn hoặc bằng 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Mã đặt phòng phải là chuỗi' })
  @IsMongoId({ message: 'Mã đặt phòng không hợp lệ' })
  booking?: string;

  @IsOptional()
  @IsString({ message: 'Mã người dùng phải là chuỗi' })
  @IsMongoId({ message: 'Mã người dùng không hợp lệ' })
  user?: string;

  @IsOptional()
  @IsEnum(RequestStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(RequestStatus).join(', ')}`,
  })
  status?: RequestStatus;
}