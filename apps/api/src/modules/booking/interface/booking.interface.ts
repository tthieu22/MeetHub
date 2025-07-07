import { Document } from 'mongoose';
import { BookingStatus } from '../booking.schema';
import { Room } from '@api/modules/rooms/room.schema';
import { User } from '@api/modules/users/schema/user.schema';

export interface IBooking extends Document {
    room: Room;
    user: User;
    startTime: Date;
    endTime: Date;
    status: BookingStatus;
    participants: User[];
    title: string;
    description: string;
}