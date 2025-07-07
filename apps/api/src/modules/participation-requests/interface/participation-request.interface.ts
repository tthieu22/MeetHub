import { Document } from 'mongoose';
import { Booking } from '@api/modules/booking/booking.schema';
import { User } from '@api/modules/users/schema/user.schema';
import { RequestStatus } from '../schemas/participation-request.schema';

export interface IParticipationRequest extends Document {
    booking: Booking;
    user: User;
    status: RequestStatus;
    approvedBy?: User;
}