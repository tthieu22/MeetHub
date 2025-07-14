import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateParticipationRequestDto } from './dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from './dto/update-participation-request.dto';
import { ParticipationRequest, RequestStatus } from './schemas/participation-request.schema';
import { IParticipationRequestService } from './interface/participation-request.service.interface';
import { Booking } from '../booking/booking.schema';
import { User } from '../users/schema/user.schema';
import { SearchParticipationRequestsDto } from './dto/search-participation-requests.dto';

@Injectable()
export class ParticipationRequestsService implements IParticipationRequestService {
  constructor(
    @InjectModel(ParticipationRequest.name) private participationRequestModel: Model<ParticipationRequest>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) { }

  async create(createDto: CreateParticipationRequestDto): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(createDto.booking)) {
        throw new BadRequestException({
          success: false,
          message: 'Booking ID không hợp lệ',
          errorCode: 'INVALID_BOOKING_ID',
        });
      }

      if (!Types.ObjectId.isValid(createDto.user)) {
        throw new BadRequestException({
          success: false,
          message: 'User ID không hợp lệ',
          errorCode: 'INVALID_USER_ID',
        });
      }

      const booking = await this.bookingModel
        .findOne({ _id: createDto.booking, status: { $ne: 'DELETED' } })
        .exec();
      if (!booking) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy đặt phòng với ID ${createDto.booking}`,
          errorCode: 'BOOKING_NOT_FOUND',
        });
      }

      const user = await this.userModel.findById(createDto.user).exec();
      if (!user) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy người dùng với ID ${createDto.user}`,
          errorCode: 'USER_NOT_FOUND',
        });
      }

      if (booking.user.toString() === createDto.user) {
        throw new BadRequestException({
          success: false,
          message: 'Không thể yêu cầu tham gia đặt phòng của chính bạn',
          errorCode: 'SELF_REQUEST_DENIED',
        });
      }

      const existingRequest = await this.participationRequestModel.findOne({
        booking: createDto.booking,
        user: createDto.user,
      }).exec();
      if (existingRequest) {
        throw new BadRequestException({
          success: false,
          message: 'Yêu cầu tham gia đã tồn tại',
          errorCode: 'DUPLICATE_REQUEST',
        });
      }

      const isAlreadyParticipant = booking.participants.some(
        participantId => participantId.toString() === createDto.user,
      );
      if (isAlreadyParticipant) {
        throw new BadRequestException({
          success: false,
          message: 'Người dùng đã là thành viên tham gia trong đặt phòng này',
          errorCode: 'ALREADY_PARTICIPANT',
        });
      }

      const createdRequest = new this.participationRequestModel({
        booking: createDto.booking,
        user: createDto.user,
        status: RequestStatus.PENDING,
      });

      const savedRequest = await createdRequest.save();

      const populatedRequest = await this.participationRequestModel
        .findById(savedRequest._id)
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException({
          success: false,
          message: 'Yêu cầu tham gia không tìm thấy sau khi tạo',
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return populatedRequest as ParticipationRequest;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu yêu cầu tham gia không hợp lệ',
          errors,
          errorCode: 'VALIDATION_ERROR',
        });
      }
      if (error.code === 11000) {
        throw new BadRequestException({
          success: false,
          message: 'Yêu cầu tham gia đã tồn tại với thông tin tương tự',
          errorCode: 'DUPLICATE_REQUEST',
        });
      }
      throw error;
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filter: any = {},
  ): Promise<{
    data: ParticipationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (page < 1 || limit < 1) {
        throw new BadRequestException({
          success: false,
          message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
          errorCode: 'INVALID_PAGINATION',
        });
      }

      // Lọc các yêu cầu có status không phải DELETED
      const updatedFilter = {
        ...filter,
        status: { $ne: RequestStatus.DELETED },
      };

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.participationRequestModel
          .find(updatedFilter)
          .skip(skip)
          .limit(limit)
          .populate('booking user approvedBy')
          .lean()
          .exec(),
        this.participationRequestModel.countDocuments(updatedFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);
      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể lấy danh sách yêu cầu tham gia',
        errorCode: 'FETCH_REQUESTS_FAILED',
      });
    }
  }

  async findOne(id: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      const request = await this.participationRequestModel
        .findOne({ _id: id, status: { $ne: RequestStatus.DELETED } })
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!request) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return request as ParticipationRequest;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể lấy thông tin yêu cầu tham gia',
        errorCode: 'FETCH_REQUEST_FAILED',
      });
    }
  }

  async update(id: string, updateDto: UpdateParticipationRequestDto): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      const request = await this.participationRequestModel
        .findOne({ _id: id, status: { $ne: RequestStatus.DELETED } })
        .exec();
      if (!request) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      if (updateDto.booking) {
        if (!Types.ObjectId.isValid(updateDto.booking)) {
          throw new BadRequestException({
            success: false,
            message: 'Booking ID không hợp lệ',
            errorCode: 'INVALID_BOOKING_ID',
          });
        }
        const booking = await this.bookingModel
          .findOne({ _id: updateDto.booking, status: { $ne: 'DELETED' } })
          .exec();
        if (!booking) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy đặt phòng với ID ${updateDto.booking}`,
            errorCode: 'BOOKING_NOT_FOUND',
          });
        }
        request.booking = updateDto.booking as any;
      }

      if (updateDto.user) {
        if (!Types.ObjectId.isValid(updateDto.user)) {
          throw new BadRequestException({
            success: false,
            message: 'User ID không hợp lệ',
            errorCode: 'INVALID_USER_ID',
          });
        }
        const user = await this.userModel.findById(updateDto.user).exec();
        if (!user) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy người dùng với ID ${updateDto.user}`,
            errorCode: 'USER_NOT_FOUND',
          });
        }
        request.user = updateDto.user as any;
      }

      if (updateDto.status) {
        request.status = updateDto.status;
      }

      if (updateDto.approvedBy) {
        if (!Types.ObjectId.isValid(updateDto.approvedBy)) {
          throw new BadRequestException({
            success: false,
            message: 'ApprovedBy ID không hợp lệ',
            errorCode: 'INVALID_APPROVER_ID',
          });
        }
        const approver = await this.userModel.findById(updateDto.approvedBy).exec();
        if (!approver) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy người duyệt với ID ${updateDto.approvedBy}`,
            errorCode: 'APPROVER_NOT_FOUND',
          });
        }
        request.approvedBy = updateDto.approvedBy as any;
      }

      const updatedRequest = await request.save();

      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException({
          success: false,
          message: 'Yêu cầu tham gia không tìm thấy sau khi cập nhật',
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return populatedRequest as ParticipationRequest;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu yêu cầu tham gia không hợp lệ',
          errors,
          errorCode: 'VALIDATION_ERROR',
        });
      }
      if (error.code === 11000) {
        throw new BadRequestException({
          success: false,
          message: 'Yêu cầu tham gia đã tồn tại với thông tin tương tự',
          errorCode: 'DUPLICATE_REQUEST',
        });
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      const result = await this.participationRequestModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể xóa yêu cầu tham gia',
        errorCode: 'DELETE_REQUEST_FAILED',
      });
    }
  }

  async approveRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      if (!Types.ObjectId.isValid(approverId)) {
        throw new BadRequestException({
          success: false,
          message: 'ID người duyệt không hợp lệ',
          errorCode: 'INVALID_APPROVER_ID',
        });
      }

      const request = await this.participationRequestModel
        .findOne({ _id: id, status: { $ne: RequestStatus.DELETED } })
        .exec();
      if (!request) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException({
          success: false,
          message: 'Yêu cầu đã được xử lý (không còn ở trạng thái PENDING)',
          errorCode: 'REQUEST_ALREADY_PROCESSED',
        });
      }

      const approver = await this.userModel.findById(approverId).exec();
      if (!approver) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy người duyệt với ID ${approverId}`,
          errorCode: 'APPROVER_NOT_FOUND',
        });
      }

      const booking = await this.bookingModel
        .findOne({ _id: request.booking, status: { $ne: 'DELETED' } })
        .populate('room')
        .exec();
      if (!booking) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy đặt phòng với ID ${request.booking}`,
          errorCode: 'BOOKING_NOT_FOUND',
        });
      }

      if (booking.user.toString() !== approverId) {
        throw new BadRequestException({
          success: false,
          message: 'Chỉ người tạo đặt phòng mới có thể duyệt yêu cầu',
          errorCode: 'UNAUTHORIZED_APPROVER',
        });
      }

      const totalParticipants = booking.participants.length + 1; // +1 for the creator
      if (totalParticipants >= (booking.room as any).capacity) {
        throw new BadRequestException({
          success: false,
          message: `Số lượng người tham gia (${totalParticipants}) vượt quá sức chứa phòng (${(booking.room as any).capacity})`,
          errorCode: 'EXCEEDED_CAPACITY',
        });
      }

      request.status = RequestStatus.ACCEPTED;
      request.approvedBy = approverId as any;

      if (!booking.participants.includes(request.user)) {
        booking.participants.push(request.user);
        await booking.save();
      }

      const updatedRequest = await request.save();

      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException({
          success: false,
          message: 'Yêu cầu tham gia không tìm thấy sau khi duyệt',
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return populatedRequest as ParticipationRequest;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể duyệt yêu cầu tham gia',
        errorCode: 'APPROVE_REQUEST_FAILED',
      });
    }
  }

  async rejectRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      if (!Types.ObjectId.isValid(approverId)) {
        throw new BadRequestException({
          success: false,
          message: 'ID người duyệt không hợp lệ',
          errorCode: 'INVALID_APPROVER_ID',
        });
      }

      const request = await this.participationRequestModel
        .findOne({ _id: id, status: { $ne: RequestStatus.DELETED } })
        .exec();
      if (!request) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException({
          success: false,
          message: 'Yêu cầu đã được xử lý (không còn ở trạng thái PENDING)',
          errorCode: 'REQUEST_ALREADY_PROCESSED',
        });
      }

      const approver = await this.userModel.findById(approverId).exec();
      if (!approver) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy người duyệt với ID ${approverId}`,
          errorCode: 'APPROVER_NOT_FOUND',
        });
      }

      const booking = await this.bookingModel
        .findOne({ _id: request.booking, status: { $ne: 'DELETED' } })
        .exec();
      if (!booking) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy đặt phòng với ID ${request.booking}`,
          errorCode: 'BOOKING_NOT_FOUND',
        });
      }

      if (booking.user.toString() !== approverId) {
        throw new BadRequestException({
          success: false,
          message: 'Chỉ người tạo đặt phòng mới có thể từ chối yêu cầu',
          errorCode: 'UNAUTHORIZED_APPROVER',
        });
      }

      request.status = RequestStatus.REJECTED;
      request.approvedBy = approverId as any;

      const updatedRequest = await request.save();

      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException({
          success: false,
          message: 'Yêu cầu tham gia không tìm thấy sau khi từ chối',
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return populatedRequest as ParticipationRequest;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể từ chối yêu cầu tham gia',
        errorCode: 'REJECT_REQUEST_FAILED',
      });
    }
  }

  async softDelete(id: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException({
          success: false,
          message: 'ID yêu cầu tham gia không hợp lệ',
          errorCode: 'INVALID_REQUEST_ID',
        });
      }

      const request = await this.participationRequestModel
        .findOne({ _id: id, status: { $ne: RequestStatus.DELETED } })
        .exec();
      if (!request) {
        throw new NotFoundException({
          success: false,
          message: `Không tìm thấy yêu cầu tham gia với ID ${id}`,
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      request.status = RequestStatus.DELETED;
      const updatedRequest = await request.save();

      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .lean()
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException({
          success: false,
          message: 'Yêu cầu tham gia không tìm thấy sau khi xóa mềm',
          errorCode: 'REQUEST_NOT_FOUND',
        });
      }

      return populatedRequest as ParticipationRequest;
    } catch (error) {
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map((err: any) => ({
          field: err.path,
          message: err.message,
        }));
        throw new BadRequestException({
          success: false,
          message: 'Dữ liệu yêu cầu tham gia không hợp lệ',
          errors,
          errorCode: 'VALIDATION_ERROR',
        });
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể xóa mềm yêu cầu tham gia',
        errorCode: 'SOFT_DELETE_REQUEST_FAILED',
      });
    }
  }
  async findAllExcludeDeleted(
    page: number = 1,
    limit: number = 10,
    filter: any = {},
  ): Promise<{
    data: ParticipationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      if (page < 1 || limit < 1) {
        throw new BadRequestException({
          success: false,
          message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
          errorCode: 'INVALID_PAGINATION',
        });
      }

      const updatedFilter = {
        ...filter,
        status: { $ne: RequestStatus.DELETED },
      };

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        this.participationRequestModel
          .find(updatedFilter)
          .skip(skip)
          .limit(limit)
          .populate('booking user approvedBy')
          .lean()
          .exec(),
        this.participationRequestModel.countDocuments(updatedFilter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);
      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể lấy danh sách yêu cầu tham gia không bị xóa',
        errorCode: 'FETCH_REQUESTS_EXCLUDE_DELETED_FAILED',
      });
    }
  }
   async searchParticipationRequestsExcludeDeleted(
    dto: SearchParticipationRequestsDto,
  ): Promise<{
    data: ParticipationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Kiểm tra tham số phân trang
      if (dto.page && (dto.page < 1 || !Number.isInteger(dto.page))) {
        throw new BadRequestException({
          success: false,
          message: 'Số trang phải là số nguyên lớn hơn hoặc bằng 1',
          errorCode: 'INVALID_PAGE',
        });
      }

      if (dto.limit && (dto.limit < 1 || !Number.isInteger(dto.limit))) {
        throw new BadRequestException({
          success: false,
          message: 'Giới hạn bản ghi phải là số nguyên lớn hơn hoặc bằng 1',
          errorCode: 'INVALID_LIMIT',
        });
      }

      // Tạo bộ lọc, loại bỏ các yêu cầu có trạng thái DELETED
      const filter: any = {
        status: { $ne: RequestStatus.DELETED },
      };

      // Kiểm tra và thêm bộ lọc cho booking nếu có
      if (dto.booking) {
        if (!Types.ObjectId.isValid(dto.booking)) {
          throw new BadRequestException({
            success: false,
            message: 'Mã đặt phòng không hợp lệ',
            errorCode: 'INVALID_BOOKING_ID',
          });
        }
        const booking = await this.bookingModel
          .findOne({ _id: dto.booking, status: { $ne: 'DELETED' } })
          .exec();
        if (!booking) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy đặt phòng với ID ${dto.booking}`,
            errorCode: 'BOOKING_NOT_FOUND',
          });
        }
        filter.booking = dto.booking;
      }

      // Kiểm tra và thêm bộ lọc cho user nếu có
      if (dto.user) {
        if (!Types.ObjectId.isValid(dto.user)) {
          throw new BadRequestException({
            success: false,
            message: 'Mã người dùng không hợp lệ',
            errorCode: 'INVALID_USER_ID',
          });
        }
        const user = await this.userModel.findById(dto.user).exec();
        if (!user) {
          throw new NotFoundException({
            success: false,
            message: `Không tìm thấy người dùng với ID ${dto.user}`,
            errorCode: 'USER_NOT_FOUND',
          });
        }
        filter.user = dto.user;
      }

      // Thêm bộ lọc trạng thái nếu có
      if (dto.status) {
        if (!Object.values(RequestStatus).includes(dto.status)) {
          throw new BadRequestException({
            success: false,
            message: `Trạng thái phải là một trong các giá trị: ${Object.values(RequestStatus).join(', ')}`,
            errorCode: 'INVALID_STATUS',
          });
        }
        filter.status = dto.status;
      }

      // Thiết lập phân trang
      const page = dto.page || 1;
      const limit = dto.limit || 10;
      const skip = (page - 1) * limit;

      // Thực hiện truy vấn với bộ lọc và phân trang
      const [data, total] = await Promise.all([
        this.participationRequestModel
          .find(filter)
          .skip(skip)
          .limit(limit)
          .populate('booking user approvedBy')
          .lean()
          .exec(),
        this.participationRequestModel.countDocuments(filter).exec(),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Trả về kết quả
      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException({
        success: false,
        message: 'Không thể tìm kiếm yêu cầu tham gia',
        errorCode: 'SEARCH_REQUESTS_FAILED',
      });
    }
  }

}