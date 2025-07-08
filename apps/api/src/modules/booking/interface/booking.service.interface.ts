import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { IBooking } from './booking.interface';

export interface IBookingService {
  create(createBookingDto: CreateBookingDto): Promise<IBooking>;
  findAll(page?: number, limit?: number, filter?: any): Promise<any>;
  findOne(id: string): Promise<IBooking>;
  update(id: string, updateBookingDto: UpdateBookingDto): Promise<IBooking>;
  remove(id: string): Promise<void>;
  cancelBooking(id: string): Promise<IBooking>;
}