import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking, BookingSchema } from './booking.schema';
import { RoomsModule } from '../rooms/rooms.module';
import { UsersModule } from '../users/users.module';


@Module({
    imports: [MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }]),
        RoomsModule,
        UsersModule],
    controllers: [BookingsController],
    providers: [BookingsService],
    exports: [BookingsService , MongooseModule.forFeature([{ name: Booking.name, schema: BookingSchema }])],
})
export class BookingsModule { }