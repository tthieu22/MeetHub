import {
  IsInt,
  Min,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class SearchBookingsDetailedDto {
  @IsOptional()
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Giới hạn bản ghi phải là số nguyên' })
  @Min(1, { message: 'Giới hạn bản ghi phải lớn hơn hoặc bằng 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Tên phòng phải là chuỗi' })
  @MinLength(2, { message: 'Tên phòng phải có ít nhất 2 ký tự' })
  roomName?: string;

  @IsOptional()
  @IsString({ message: 'Tên người dùng phải là chuỗi' })
  @MinLength(2, { message: 'Tên người dùng phải có ít nhất 2 ký tự' })
  userName?: string;

  @IsOptional()
  @IsString({ message: 'Ngày phải là chuỗi' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Ngày phải có định dạng YYYY-MM-DD (ví dụ: 2025-07-10)',
  })
  date?: string;

  @IsOptional()
  @IsString({ message: 'Tiêu đề phải là chuỗi' })
  @MinLength(2, { message: 'Tiêu đề phải có ít nhất 2 ký tự' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi' })
  @MinLength(2, { message: 'Mô tả phải có ít nhất 2 ký tự' })
  description?: string;
}