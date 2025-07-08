import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Booking, BookingSchema } from './booking.schema';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { BOOKING_SERVICE_TOKEN } from './booking.tokens';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '@api/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
    RoomsModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [BookingsController],
  providers: [
    BookingsService,
    {
      provide: BOOKING_SERVICE_TOKEN,
      useClass: BookingsService,
    },
  ],
  exports: [BOOKING_SERVICE_TOKEN, MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }])],
})
export class BookingsModule {}