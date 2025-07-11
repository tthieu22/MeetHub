import {
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsMongoId,
  IsEnum,
  Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '../booking.schema';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';

// Validator tùy chỉnh để kiểm tra endTime >= startTime
@ValidatorConstraint({ name: 'isEndTimeAfterStartTime', async: false })
export class IsEndTimeAfterStartTimeConstraint implements ValidatorConstraintInterface {
  validate(endTime: string, args: ValidationArguments) {
    const startTime = (args.object as any).startTime;
    if (!startTime || !endTime) return true; // Bỏ qua nếu không cung cấp cả hai
    return new Date(endTime) >= new Date(startTime);
  }

  defaultMessage(args: ValidationArguments) {
    return 'Thời gian kết thúc phải lớn hơn hoặc bằng thời gian bắt đầu';
  }
}

// Validator tùy chỉnh để kiểm tra startTime trong tương lai
@ValidatorConstraint({ name: 'isFutureDate', async: false })
export class IsFutureDateConstraint implements ValidatorConstraintInterface {
  validate(startTime: string, args: ValidationArguments) {
    if (!startTime) return true; // Bỏ qua nếu không cung cấp
    return new Date(startTime) > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return 'Thời gian bắt đầu phải là thời điểm trong tương lai';
  }
}

export class UpdateBookingDto {
  @IsOptional()
  @IsMongoId({ message: 'Trường `room` phải là một MongoDB ObjectId hợp lệ' })
  room?: string;

  @IsOptional()
  @IsMongoId({ message: 'Trường `user` phải là một MongoDB ObjectId hợp lệ' })
  user?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Trường `startTime` phải là chuỗi ngày giờ ISO 8601 hợp lệ' })
  @Validate(IsFutureDateConstraint, { message: 'Thời gian bắt đầu phải là thời điểm trong tương lai' })
  startTime?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Trường `endTime` phải là chuỗi ngày giờ ISO 8601 hợp lệ' })
  @Validate(IsEndTimeAfterStartTimeConstraint)
  endTime?: string;

  @IsOptional()
  @IsArray({ message: 'Trường `participants` phải là một mảng' })
  @IsMongoId({ each: true, message: 'Mỗi phần tử trong `participants` phải là một MongoDB ObjectId hợp lệ' })
  participants?: string[];

  @IsOptional()
  @IsString({ message: 'Trường `title` phải là một chuỗi' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'Trường `description` phải là một chuỗi' })
  description?: string;

  @IsOptional()
  @IsEnum(BookingStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(BookingStatus).join(', ')}`,
  })
  status?: BookingStatus;
}