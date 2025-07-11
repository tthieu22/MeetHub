import { CreateBookingDto } from '../dto/create-booking.dto';
import { UpdateBookingDto } from '../dto/update-booking.dto';
import { SearchBookingsDto } from '../dto/search-bookings.dto';
import { SearchBookingsDetailedDto } from '../dto/search-bookings-detailed.dto';
import { IBooking } from './booking.interface';

export interface IBookingService {
  create(createBookingDto: CreateBookingDto): Promise<IBooking>;
  findAll(page?: number, limit?: number, filter?: any): Promise<any>;
  findOne(id: string): Promise<IBooking>;
  update(id: string, updateBookingDto: UpdateBookingDto): Promise<IBooking>;
  remove(id: string): Promise<void>;
  cancelBooking(id: string): Promise<IBooking>;
  searchBookings(dto: SearchBookingsDto): Promise<any>;
  searchBookingsDetailed(dto: SearchBookingsDetailedDto): Promise<any>;
  setBookingStatusToDeleted(id: string): Promise<IBooking>;
  findAllExcludeDeleted(page?: number, limit?: number): Promise<any>;
  addParticipant(bookingId: string, userId: string, requesterId: string): Promise<IBooking>;
  searchBookingsExcludeDeleted(dto: SearchBookingsDetailedDto): Promise<any>;
}