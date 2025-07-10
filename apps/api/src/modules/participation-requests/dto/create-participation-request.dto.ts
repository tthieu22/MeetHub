import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class CreateParticipationRequestDto {
  @IsNotEmpty({ message: 'Mã đặt phòng bắt buộc phải có' })
  @IsString({ message: 'Mã đặt phòng phải là chữ' })
  @IsMongoId({ message: 'Mã đặt phòng không hợp lệ' })
  booking: string;

  @IsNotEmpty({ message: 'Mã người dùng bắt buộc phải có' })
  @IsString({ message: 'Mã người dùng là chữ' })
  @IsMongoId({ message: 'Mã người dùng không hợp lệ' })
  user: string;
}