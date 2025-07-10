import { BadRequestException, Injectable, NotFoundException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, PipelineStage } from 'mongoose';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { Booking, BookingStatus } from './booking.schema';
import { IBookingService } from './interface/booking.service.interface';
import { IBooking } from './interface/booking.interface';
import { ROOM_SERVICE_TOKEN } from '../rooms/room.tokens';
import { IRoomService } from '../rooms/interface/room.service.interface';
import { User } from '../users/schema/user.schema';
import { SearchBookingsDto } from './dto/search-bookings.dto';
import { SearchBookingsDetailedDto } from './dto/search-bookings-detailed.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingsService implements IBookingService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel('User') private userModel: Model<User>,
    @Inject(forwardRef(() => ROOM_SERVICE_TOKEN))
    private roomService: IRoomService,
    private notificationService: NotificationService,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<IBooking> {
    try {
      // VALIDATION: Kiểm tra phòng tồn tại và trạng thái
      const room = (await this.roomService.getRoomById(createBookingDto.room)) as Document & { _id: string; capacity: number; status: string };
      if (!room) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy phòng với ID ${createBookingDto.room}`,
          errorCode: 'ROOM_NOT_FOUND',
        });
      }
      if (room.status !== 'available') {
        throw new BadRequestException({
          success: false,
          message: `Phòng hiện không khả dụng (trạng thái: ${room.status})`,
          errorCode: 'ROOM_UNAVAILABLE',
        });
      }

      // VALIDATION: Kiểm tra người dùng tồn tại
      const user = await this.userModel.findById(createBookingDto.user);
      if (!user) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy người dùng với ID ${createBookingDto.user}`,
          errorCode: 'USER_NOT_FOUND',
        });
      }

      // VALIDATION: Kiểm tra participants
      const participants: (User & Document)[] = createBookingDto.participants?.length
        ? await Promise.all(
            createBookingDto.participants.map(async (id) => {
              const participant = await this.userModel.findById(id);
              if (!participant) {
                throw new NotFoundException({
                  success: false,
                  message: `Không tìm thấy người tham gia với ID ${id}`,
                  errorCode: 'PARTICIPANT_NOT_FOUND',
                });
              }
              return participant;
            }),
          )
        : [];

      // VALIDATION: Kiểm tra sức chứa
      const totalParticipants = participants.length + 1; // +1 cho người đặt
      if (totalParticipants > room.capacity) {
        throw new BadRequestException({
          success: false,
          message: `Số lượng người tham gia (${totalParticipants}) vượt quá sức chứa phòng (${room.capacity})`,
          errorCode: 'EXCEEDED_CAPACITY',
        });
      }

      // VALIDATION: Kiểm tra thời gian hợp lệ
      const startTime = new Date(createBookingDto.startTime);
      const endTime = new Date(createBookingDto.endTime);
      if (startTime >= endTime) {
        throw new BadRequestException({
          success: false,
          message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
          errorCode: 'INVALID_TIME_RANGE',
        });
      }

      // VALIDATION: Kiểm tra booking trong tương lai
      const now = new Date();
      if (startTime < now) {
        throw new BadRequestException({
          success: false,
          message: 'Không thể đặt phòng trong quá khứ',
          errorCode: 'PAST_BOOKING',
        });
      }

      // VALIDATION: Kiểm tra trùng lịch
      const existingBooking = await this.bookingModel.findOne({
        room: createBookingDto.room,
        $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
        status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
      });
      if (existingBooking) {
        throw new BadRequestException({
          success: false,
          message: 'Phòng đã được đặt trong khoảng thời gian này',
          errorCode: 'ROOM_OCCUPIED',
        });
      }

      // Tạo booking
      const createdBooking = new this.bookingModel({
        ...createBookingDto,
        participants,
      });
      const savedBooking = await createdBooking.save();
      for (const participant of participants) {
        const userObj = user as any;
        const roomObj = room as any;
        const participantObj = participant as any;
        try {
          await this.notificationService.notify(
            participantObj._id.toString(),
            `Bạn đã được thêm vào lịch họp "${roomObj.name}" lúc ${createdBooking.startTime.toLocaleString()} do ${userObj.name} tạo `,
            'booking',
          );
        } catch (err) {
          console.error(`Không thể gửi noti cho ${participantObj._id}:`, err.message);
        }
      }
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
          errorCode: 'VALIDATION_ERROR',
        });
      }
      if (error.code === 11000) {
        throw new BadRequestException({
          success: false,
          message: 'Booking đã tồn tại với thông tin tương tự',
          errorCode: 'DUPLICATE_BOOKING',
        });
      }
      throw error;
    }
  }

  async findAll(page = 1, limit = 10, filter: any = {}): Promise<any> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
        errorCode: 'INVALID_PAGINATION',
      });
    }

    const skip = (page - 1) * limit;

    // Tính toán time filter dựa trên mode
    const timeFilter: any = {};
    const mode = filter.mode; // 'day' | 'week' | 'month' | 'range'
    const dateStr = filter.date; // YYYY-MM-DD

    if (mode && dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const baseDate = new Date(year, month - 1, day);

      if (mode === 'day') {
        const startOfDay = new Date(baseDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(baseDate.setHours(23, 59, 59, 999));
        timeFilter.startTime = { $gte: startOfDay, $lte: endOfDay };
      } else if (mode === 'week') {
        const dayOfWeek = baseDate.getDay(); // 0 = CN, 1 = T2, ...
        const diffToMonday = (dayOfWeek + 6) % 7;
        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() - diffToMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        endOfWeek.setMilliseconds(-1);

        timeFilter.startTime = { $gte: startOfWeek, $lte: endOfWeek };
      } else if (mode === 'month') {
        const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
        timeFilter.startTime = { $gte: startOfMonth, $lte: endOfMonth };
      }
    }

    // Nếu mode là 'range', dùng startTimeFrom, startTimeTo (chuỗi ISO)
    if (mode === 'range') {
      const { startTimeFrom, startTimeTo } = filter;
      timeFilter.startTime = {};
      if (startTimeFrom) timeFilter.startTime.$gte = new Date(startTimeFrom);
      if (startTimeTo) timeFilter.startTime.$lte = new Date(startTimeTo);
    }

    // Xóa các field không cần khỏi filter gốc
    delete filter.mode;
    delete filter.date;
    delete filter.startTimeFrom;
    delete filter.startTimeTo;

    const finalFilter = { ...filter, ...timeFilter };

    const [data, total] = await Promise.all([
      this.bookingModel.find(finalFilter).skip(skip).limit(limit).populate('room user participants').lean().exec(),
      this.bookingModel.countDocuments(finalFilter),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message: `Lấy danh sách ${data.length} đặt phòng thành công (trang ${page}/${totalPages})`,
      total,
      page,
      limit,
      totalPages,
      data,
    };
  }

  async findOne(id: string): Promise<IBooking> {
    const booking = await this.bookingModel.findById(id).populate('room user participants').lean().exec();

    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy đặt phòng với ID ${id}`,
        errorCode: 'BOOKING_NOT_FOUND',
      });
    }
    return booking as IBooking;
  }

  async update(id: string, updateBookingDto: UpdateBookingDto): Promise<IBooking> {
    try {
      // VALIDATION: Kiểm tra phòng nếu được cập nhật
      let room: (Document & { _id: string; capacity: number; status: string }) | null = null;
      if (updateBookingDto.room) {
        room = (await this.roomService.getRoomById(updateBookingDto.room)) as Document & { _id: string; capacity: number; status: string };
        if (!room) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy phòng với ID ${updateBookingDto.room}`,
            errorCode: 'ROOM_NOT_FOUND',
          });
        }
        if (room.status !== 'available') {
          throw new BadRequestException({
            success: false,
            message: `Phòng hiện không khả dụng (trạng thái: ${room.status})`,
            errorCode: 'ROOM_UNAVAILABLE',
          });
        }
      }

      // VALIDATION: Kiểm tra người dùng nếu được cập nhật
      if (updateBookingDto.user) {
        const user = await this.userModel.findById(updateBookingDto.user);
        if (!user) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy người dùng với ID ${updateBookingDto.user}`,
            errorCode: 'USER_NOT_FOUND',
          });
        }
      }

      // VALIDATION: Kiểm tra participants nếu được cập nhật
      let participants: (User & Document)[] = [];
      if (updateBookingDto.participants?.length) {
        participants = await Promise.all(
          updateBookingDto.participants.map(async (id) => {
            const participant = await this.userModel.findById(id);
            if (!participant) {
              throw new NotFoundException({
                success: false,
                message: `Không tìm thấy người tham gia với ID ${id}`,
                errorCode: 'PARTICIPANT_NOT_FOUND',
              });
            }
            return participant;
          }),
        );
      }

      // VALIDATION: Kiểm tra sức chứa nếu phòng hoặc participants được cập nhật
      if (updateBookingDto.room || updateBookingDto.participants) {
        const booking = await this.bookingModel.findById(id).lean().exec();
        if (!booking) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy đặt phòng với ID ${id}`,
            errorCode: 'BOOKING_NOT_FOUND',
          });
        }
        room = room || ((await this.roomService.getRoomById(booking.room.toString())) as Document & { _id: string; capacity: number; status: string });
        const totalParticipants = (updateBookingDto.participants?.length || booking.participants.length) + 1;
        if (totalParticipants > room.capacity) {
          throw new BadRequestException({
            success: false,
            message: `Số lượng người tham gia (${totalParticipants}) vượt quá sức chứa phòng (${room.capacity})`,
            errorCode: 'EXCEEDED_CAPACITY',
          });
        }
      }

      // VALIDATION: Kiểm tra thời gian nếu được cập nhật
      if (updateBookingDto.startTime || updateBookingDto.endTime) {
        const booking = await this.bookingModel.findById(id).lean().exec();
        if (!booking) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy đặt phòng với ID ${id}`,
            errorCode: 'BOOKING_NOT_FOUND',
          });
        }
        const startTime = updateBookingDto.startTime ? new Date(updateBookingDto.startTime) : new Date(booking.startTime);
        const endTime = updateBookingDto.endTime ? new Date(updateBookingDto.endTime) : new Date(booking.endTime);
        if (startTime >= endTime) {
          throw new BadRequestException({
            success: false,
            message: 'Thời gian bắt đầu phải trước thời gian kết thúc',
            errorCode: 'INVALID_TIME_RANGE',
          });
        }
        if (startTime < new Date()) {
          throw new BadRequestException({
            success: false,
            message: 'Không thể cập nhật thời gian đặt phòng trong quá khứ',
            errorCode: 'PAST_BOOKING',
          });
        }
      }

      const updatedBooking = await this.bookingModel
        .findByIdAndUpdate(id, { ...updateBookingDto, participants }, { new: true })
        .populate('room user participants')
        .lean()
        .exec();

      if (!updatedBooking) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy đặt phòng với ID ${id}`,
          errorCode: 'BOOKING_NOT_FOUND',
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
          errorCode: 'VALIDATION_ERROR',
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
        message: `Không tìm thấy đặt phòng với ID ${id}`,
        errorCode: 'BOOKING_NOT_FOUND',
      });
    }
  }

  async cancelBooking(id: string): Promise<IBooking> {
    const booking = await this.bookingModel.findById(id).populate('room').lean().exec();
    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy đặt phòng với ID ${id}`,
        errorCode: 'BOOKING_NOT_FOUND',
      });
    }
    const updatedBooking = await this.bookingModel.findByIdAndUpdate(id, { status: BookingStatus.CANCELLED }, { new: true }).populate('room user participants').lean().exec();
    return updatedBooking as IBooking;
  }

  async searchBookings(dto: SearchBookingsDto): Promise<any> {
    const { page = 1, limit = 10, roomName, userName, date } = dto;

    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
        errorCode: 'INVALID_PAGINATION',
      });
    }

    const filter: any = {};

    if (roomName) {
      if (typeof roomName !== 'string' || roomName.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Tên phòng phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_ROOM_NAME',
        });
      }
      filter['room.name'] = { $regex: roomName.trim(), $options: 'i' };
    }

    if (userName) {
      if (typeof userName !== 'string' || userName.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Tên người dùng phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_USER_NAME',
        });
      }
      filter['user.name'] = { $regex: userName.trim(), $options: 'i' };
    }

    if (date) {
      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      if (!dateRegex.test(date)) {
        throw new BadRequestException({
          success: false,
          message: 'Định dạng ngày không hợp lệ, phải là YYYY-MM-DD (ví dụ: 2025-07-10)',
          errorCode: 'INVALID_DATE_FORMAT',
        });
      }
      const [year, month, day] = date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year || parsedDate.getMonth() + 1 !== month || parsedDate.getDate() !== day) {
        throw new BadRequestException({
          success: false,
          message: 'Ngày không hợp lệ',
          errorCode: 'INVALID_DATE',
        });
      }
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    if (!roomName && !userName && !date) {
      throw new BadRequestException({
        success: false,
        message: 'Phải cung cấp ít nhất một tiêu chí tìm kiếm: tên phòng, tên người dùng hoặc ngày',
        errorCode: 'MISSING_SEARCH_CRITERIA',
      });
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([this.bookingModel.find(filter).skip(skip).limit(limit).populate('room user participants').lean().exec(), this.bookingModel.countDocuments(filter)]);

    const totalPages = Math.ceil(total / limit);
    const message = `Tìm thấy ${data.length} đặt phòng khớp với tiêu chí (trang ${page}/${totalPages})`;
    return {
      success: true,
      message,
      total,
      page,
      limit,
      totalPages,
      data,
    };
  }

  async searchBookingsDetailed(dto: SearchBookingsDetailedDto): Promise<any> {
    const { page = 1, limit = 10, roomName, userName, date, title, description } = dto;

    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
        errorCode: 'INVALID_PAGINATION',
      });
    }

    const filter: any = {};

    if (roomName) {
      if (typeof roomName !== 'string' || roomName.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Tên phòng phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_ROOM_NAME',
        });
      }
      filter['room.name'] = { $regex: roomName.trim(), $options: 'i' };
    }

    if (userName) {
      if (typeof userName !== 'string' || userName.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Tên người dùng phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_USER_NAME',
        });
      }
      filter['user.name'] = { $regex: userName.trim(), $options: 'i' };
    }

    if (date) {
      const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
      if (!dateRegex.test(date)) {
        throw new BadRequestException({
          success: false,
          message: 'Định dạng ngày không hợp lệ, phải là YYYY-MM-DD (ví dụ: 2025-07-10)',
          errorCode: 'INVALID_DATE_FORMAT',
        });
      }
      const [year, month, day] = date.split('-').map(Number);
      const parsedDate = new Date(year, month - 1, day);
      if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() !== year || parsedDate.getMonth() + 1 !== month || parsedDate.getDate() !== day) {
        throw new BadRequestException({
          success: false,
          message: 'Ngày không hợp lệ',
          errorCode: 'INVALID_DATE',
        });
      }
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(parsedDate);
      endOfDay.setHours(23, 59, 59, 999);
      filter.startTime = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    if (title) {
      if (typeof title !== 'string' || title.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Tiêu đề phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_TITLE',
        });
      }
      filter.title = { $regex: title.trim(), $options: 'i' };
    }

    if (description) {
      if (typeof description !== 'string' || description.trim().length < 2) {
        throw new BadRequestException({
          success: false,
          message: 'Mô tả phải là chuỗi và có ít nhất 2 ký tự',
          errorCode: 'INVALID_DESCRIPTION',
        });
      }
      filter.description = { $regex: description.trim(), $options: 'i' };
    }

    if (!roomName && !userName && !date && !title && !description) {
      throw new BadRequestException({
        success: false,
        message: 'Phải cung cấp ít nhất một tiêu chí tìm kiếm',
        errorCode: 'MISSING_SEARCH_CRITERIA',
      });
    }

    const pipeline: PipelineStage[] = [
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'room',
        },
      },
      { $unwind: '$room' },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'users',
          localField: 'participants',
          foreignField: '_id',
          as: 'participants',
        },
      },
      { $match: filter },
      {
        $addFields: {
          matchScore: {
            $sum: [
              ...(roomName ? [{ $cond: [{ $regexMatch: { input: '$room.name', regex: roomName, options: 'i' } }, 1, 0] }] : []),
              ...(userName ? [{ $cond: [{ $regexMatch: { input: '$user.name', regex: userName, options: 'i' } }, 1, 0] }] : []),
              ...(date
                ? [
                    {
                      $cond: [
                        {
                          $and: [{ $gte: ['$startTime', filter.startTime.$gte] }, { $lte: ['$startTime', filter.startTime.$lte] }],
                        },
                        1,
                        0,
                      ],
                    },
                  ]
                : []),
              ...(title ? [{ $cond: [{ $regexMatch: { input: '$title', regex: title, options: 'i' } }, 1, 0] }] : []),
              ...(description ? [{ $cond: [{ $regexMatch: { input: '$description', regex: description, options: 'i' } }, 1, 0] }] : []),
            ],
          },
        },
      },
      { $sort: { matchScore: -1, startTime: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
    ];

    const [data, total] = await Promise.all([this.bookingModel.aggregate(pipeline).exec(), this.bookingModel.countDocuments(filter)]);

    const totalPages = Math.ceil(total / limit);
    const message = `Tìm thấy ${data.length} đặt phòng khớp với tiêu chí (trang ${page}/${totalPages})`;
    return {
      success: true,
      message,
      total,
      page,
      limit,
      totalPages,
      data,
    };
  }

  async setBookingStatusToDeleted(id: string): Promise<IBooking> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) {
      throw new NotFoundException({
        success: false,
        message: `Không tìm thấy đặt phòng với ID ${id}`,
        errorCode: 'BOOKING_NOT_FOUND',
      });
    }
    booking.status = BookingStatus.DELETED;
    const updatedBooking = await booking.save();
    return updatedBooking.toObject() as IBooking;
  }

  async findAllExcludeDeleted(page = 1, limit = 10): Promise<any> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException({
        success: false,
        message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
        errorCode: 'INVALID_PAGINATION',
      });
    }

    const skip = (page - 1) * limit;
    const filter = { status: { $ne: BookingStatus.DELETED } };

    const [data, total] = await Promise.all([this.bookingModel.find(filter).skip(skip).limit(limit).populate('room user participants').lean().exec(), this.bookingModel.countDocuments(filter)]);

    const totalPages = Math.ceil(total / limit);
    return {
      success: true,
      message: `Lấy danh sách ${data.length} đặt phòng (không bao gồm trạng thái DELETED) thành công (trang ${page}/${totalPages})`,
      total,
      page,
      limit,
      totalPages,
      data,
    };
  }
}
