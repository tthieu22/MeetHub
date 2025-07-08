import { 
  BadRequestException, 
  Injectable, 
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './booking.schema';
import { IBookingService } from './interface/booking.service.interface';
import { IBooking } from './interface/booking.interface';
import { ROOM_SERVICE_TOKEN } from '../rooms/room.tokens';
import { IRoomService } from '../rooms/interface/room.service.interface';
import { User } from '../users/schema/user.schema';

@Injectable()
export class BookingsService implements IBookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel('User') private userModel: Model<User>,
    @Inject(forwardRef(() => ROOM_SERVICE_TOKEN))
    private roomService: IRoomService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<IBooking> {
    try {
      const room = await this.roomService.getRoomById(createBookingDto.room);
      if (!room) {
        throw new NotFoundException({
          success: false,
          message: 'Không tìm thấy phòng',
        });
      }

      const user = await this.userModel.findById(createBookingDto.user);
      if (!user) {
        throw new NotFoundException({
          success: false,
          message: 'Không tìm thấy người dùng',
        });
      }

      const participants = await Promise.all(
        createBookingDto.participants.map(async (id) => {
          const participant = await this.userModel.findById(id);
          if (!participant) {
            throw new NotFoundException({
              success: false,
              message: `Không tìm thấy người tham gia với ID ${id}`,
            });
          }
          return participant;
        })
      );

      // Kiểm tra xem phòng đã được đặt trong khoảng thời gian này chưa
      const existingBooking = await this.bookingModel.findOne({
        room: createBookingDto.room,
        $or: [
          { startTime: { $lt: createBookingDto.endTime }, endTime: { $gt: createBookingDto.startTime } }
        ],
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] }
      });

      if (existingBooking) {
        throw new BadRequestException({
          success: false,
          message: 'Phòng đã được đặt trong khoảng thời gian này',
        });
      }

      const createdBooking = new this.bookingModel({
        ...createBookingDto,
        participants
      });
      const savedBooking = await createdBooking.save();
      return savedBooking.toObject() as IBooking;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu đặt phòng không hợp lệ',
          errors,
        });
      }
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, filter: any = {}): Promise<any> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.bookingModel.find(filter)
        .skip(skip)
        .limit(limit)
        .populate('room user participants')
        .lean()
        .exec(),
      this.bookingModel.countDocuments(filter),
    ]);
    
    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      total,
      page,
      limit,
      totalPages,
      data,
      filter,
    };
  }

  async findOne(id: string): Promise<IBooking> {
    const booking = await this.bookingModel.findById(id)
      .populate('room user participants')
      .lean()
      .exec();
    
    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy booking với ID ${id}`,
      });
    }
    return booking as IBooking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<IBooking> {
    try {
      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(id, updateBookingDto, { new: true })
        .populate('room user participants')
        .lean()
        .exec();
      
      if (!updatedBooking) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy booking với ID ${id}`,
        });
      }
      return updatedBooking as IBooking;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu đặt phòng không hợp lệ',
          errors,
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.bookingModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy booking với ID ${id}`,
      });
    }
  }

  async cancelBooking(id: string): Promise<IBooking> {
    const booking = await this.bookingModel.findByIdAndUpdate(
      id,
      { status: BookingStatus.CANCELLED },
      { new: true }
    )
    .populate('room user participants')
    .lean()
    .exec();
    
    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy booking với ID ${id}`,
      });
    }
    return booking as IBooking;
  }
}