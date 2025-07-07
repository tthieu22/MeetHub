import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './booking.schema';
import { IBookingService } from './interface/booking.service.interface';
import { Room } from '../rooms/room.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class BookingsService implements IBookingService {
    constructor(
        @InjectModel(Booking.name) private bookingModel: Model<Booking>,
        @InjectModel('Room') private roomModel: Model<Room>,
        @InjectModel('User') private userModel: Model<User>,
    ) { }

    async create(createBookingDto: CreateBookingDto): Promise<Booking> {
        const room = await this.roomModel.findById(createBookingDto.room);
        if (!room) {
            throw new NotFoundException('Room not found');
        }

        const user = await this.userModel.findById(createBookingDto.user);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        const participants = await Promise.all(
            createBookingDto.participants.map(async (id) => {
                const participant = await this.userModel.findById(id);
                if (!participant) {
                    throw new NotFoundException(`Participant with ID ${id} not found`);
                }
                return participant;
            })
        );

        const existingBooking = await this.bookingModel.findOne({
            room: createBookingDto.room,
            $or: [
                { startTime: { $lt: createBookingDto.endTime }, endTime: { $gt: createBookingDto.startTime } }
            ],
            status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
        });

        if (existingBooking) {
            throw new BadRequestException('The room is already booked for the given time');
        }

        const createdBooking = new this.bookingModel({
            ...createBookingDto,
            participants
        });
        return createdBooking.save();
    }

    async findAll(): Promise<Booking[]> {
        return this.bookingModel.find().populate('room user participants').exec();
    }

    async findOne(id: string): Promise<Booking> {
        const booking = await this.bookingModel.findById(id).populate('room user participants').exec();
        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
        return booking;
    }

    async update(id: string, updateBookingDto: UpdateBookingDto): Promise<Booking> {
        const updatedBooking = await this.bookingModel
            .findByIdAndUpdate(id, updateBookingDto, { new: true })
            .populate('room user participants')
            .exec();
        if (!updatedBooking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
        return updatedBooking;
    }

    async remove(id: string): Promise<void> {
        const result = await this.bookingModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
    }

    async cancelBooking(id: string): Promise<Booking> {
        const booking = await this.bookingModel.findById(id);
        if (!booking) {
            throw new NotFoundException(`Booking with ID ${id} not found`);
        }
        booking.status = BookingStatus.CANCELLED;
        return booking.save();
    }
}