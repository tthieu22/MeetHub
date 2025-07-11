import {
  IsArray,
  IsDateString,
  IsNotEmpty,
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
    if (!startTime || !endTime) return false;
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
    if (!startTime) return false;
    return new Date(startTime) > new Date();
  }

  defaultMessage(args: ValidationArguments) {
    return 'Thời gian bắt đầu phải là thời điểm trong tương lai';
  }
}

export class CreateBookingDto {
  @IsNotEmpty({ message: 'Trường `room` là bắt buộc và không được để trống' })
  @IsMongoId({ message: 'Trường `room` phải là một MongoDB ObjectId hợp lệ' })
  room: string;

  @IsNotEmpty({ message: 'Trường `user` là bắt buộc và không được để trống' })
  @IsMongoId({ message: 'Trường `user` phải là một MongoDB ObjectId hợp lệ' })
  user: string;

  @IsNotEmpty({ message: 'Trường `startTime` là bắt buộc và không được để trống' })
  @IsDateString({}, { message: 'Trường `startTime` phải là chuỗi ngày giờ ISO 8601 hợp lệ' })
  @Validate(IsFutureDateConstraint, { message: 'Thời gian bắt đầu phải là thời điểm trong tương lai' })
  startTime: string;

  @IsNotEmpty({ message: 'Trường `endTime` là bắt buộc và không được để trống' })
  @IsDateString({}, { message: 'Trường `endTime` phải là chuỗi ngày giờ ISO 8601 hợp lệ' })
  @Validate(IsEndTimeAfterStartTimeConstraint)
  endTime: string;

  @IsArray({ message: 'Trường `participants` phải là một mảng' })
  @IsMongoId({ each: true, message: 'Mỗi phần tử trong `participants` phải là một MongoDB ObjectId hợp lệ' })
  @IsOptional()
  participants?: string[];

  @IsString({ message: 'Trường `title` phải là một chuỗi' })
  @IsOptional()
  title?: string;

  @IsString({ message: 'Trường `description` phải là một chuỗi' })
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsEnum(BookingStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(BookingStatus).join(', ')}`,
  })
  status?: BookingStatus;
}