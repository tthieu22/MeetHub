import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';
import { IRoomService } from './interface/room.service.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { IRoom } from './interface/room.interface';

@Injectable()
export class RoomsService implements IRoomService {
    constructor(@InjectModel(Room.name) private roomModel: Model<Room>) { }

    async createRoom(createRoomDto: CreateRoomDto): Promise<IRoom> {
        try {
            const createdRoom = new this.roomModel(createRoomDto);
            const savedRoom = await createdRoom.save();
            return savedRoom.toObject() as IRoom;
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException({
                    success: false,
                    message: `Phòng với tên ${createRoomDto.name} đã tồn tại`,
                });
            }
            if (createRoomDto.capacity < 6) {
                throw new BadRequestException({
                    success: false,
                    message: 'Sức chứa phòng phải lớn hơn 5 người',
                    errorCode: 'INVALID_CAPACITY'
                });
            }
            if (createRoomDto.location === 'tầng 1704 - tầng 17 - 19 Tố Hữu') {
                throw new BadRequestException({
                    success: false,
                    message: 'Vị trí phòng không hợp lệ',
                    errorCode: 'INVALID_LOCATION'
                });
            }
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map((err: any) => ({
                    field: err.path,
                    message: err.message,
                }));
                throw new BadRequestException({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors,
                });
            }
            throw error;
        }
    }

    async getAllRooms(page: number = 1, limit: number = 10, filter: any = {}): Promise<any> {
        // Validate phân trang
        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                success: false,
                message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
                errorCode: 'INVALID_PAGINATION'
            });
        }

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.roomModel.find(filter)
                .skip(skip)
                .limit(limit)
                .lean()
                .exec(),
            this.roomModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            success: true,
            message: `Lấy danh sách phòng thành công (trang ${page}/${totalPages})`,
            total,
            page,
            limit,
            totalPages,
            data,
        };
    }

    async getAvailableRooms(page: number = 1, limit: number = 10, filter: any = {}): Promise<any> {
        const availableFilter = { ...filter, status: 'available' };
        return this.getAllRooms(page, limit, availableFilter);
    }

    async getRoomById(id: string): Promise<IRoom> {
        const room = await this.roomModel.findById(id).lean().exec();
        if (!room) {
            throw new NotFoundException({
                success: false,
                message: `Không tìm thấy mã phòng ${id} `,
            });
        }
        return room as IRoom;
    }

    async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<IRoom> {
        try {
            const updatedRoom = await this.roomModel
                .findByIdAndUpdate(id, updateRoomDto, { new: true })
                .lean()
                .exec();
            if (!updatedRoom) {
                throw new NotFoundException({
                    success: false,
                    message: `Phòng với mã ${id} không tìm thấy`,
                });
            }
            return updatedRoom as IRoom;
        } catch (error) {
            if (error.code === 11000) {
                throw new BadRequestException({
                    success: false,
                    message: `Phòng với tên ${updateRoomDto.name} đã tồn tại`,
                });
            }
            if (updateRoomDto.capacity !== undefined && updateRoomDto.capacity < 6) {
                throw new BadRequestException({
                    success: false,
                    message: 'Sức chứa phòng phải lớn hơn 5 người',
                    errorCode: 'INVALID_CAPACITY'
                });
            }
            if (updateRoomDto.status === 'Deleted') {
                throw new BadRequestException({
                    success: false,
                    message: 'Không thể cập nhật trạng thái phòng thành "Deleted"',
                    errorCode: 'INVALID_STATUS'
                });
            }
            if (updateRoomDto.location === 'tầng 1704 - tầng 17 - 19 Tố Hữu') {
                throw new BadRequestException({
                    success: false,
                    message: 'Vị trí phòng không hợp lệ',
                    errorCode: 'INVALID_LOCATION'
                });
            }
            if (error.name === 'ValidationError') {
                const errors = Object.values(error.errors).map((err: any) => ({
                    field: err.path,
                    message: err.message,
                }));
                throw new BadRequestException({
                    success: false,
                    message: 'Dữ liệu không hợp lệ',
                    errors,
                });
            }

            throw error;
        }
    }

    async deleteRoom(id: string): Promise<void> {
        const result = await this.roomModel.findByIdAndDelete(id).exec();
        if (!result) {
            throw new NotFoundException({
                success: false,
                message: `Phòng với mã ${id} không tìm thấy`,
            });
        }
    }

    async searchRooms(filters: {
        keyword?: string;
        location?: string;
        minCapacity?: number;
        maxCapacity?: number;
        status?: string;
        hasProjector?: boolean;
        allowFood?: boolean;
        features?: string[];
        fromDate?: string;
        toDate?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            appliedFilters: Partial<typeof filters>;
        };
    }> {
        // Validate phân trang
        const page = filters.page || 1;
        const limit = filters.limit || 10;

        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                success: false,
                message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
                errorCode: 'INVALID_PAGINATION'
            });
        }

        // Xây dựng query MongoDB
        const query: any = { isActive: true }; // Mặc định chỉ tìm phòng active

        // 1. Tìm kiếm đa trường (name, description)
        if (filters.keyword) {
            const keywordRegex = new RegExp(filters.keyword, 'i');
            query.$or = [
                { name: { $regex: keywordRegex } },
                { description: { $regex: keywordRegex } },
                { 'devices.name': { $regex: keywordRegex } }
            ];
        }

        // 2. Lọc theo location
        if (filters.location) {
            query.location = filters.location;
        }

        // 3. Lọc theo sức chứa
        if (filters.minCapacity || filters.maxCapacity) {
            query.capacity = {};
            if (filters.minCapacity) {
                if (filters.minCapacity < 0) {
                    throw new BadRequestException({
                        success: false,
                        message: 'Sức chứa tối thiểu không được âm',
                        errorCode: 'INVALID_MIN_CAPACITY'
                    });
                }
                query.capacity.$gte = filters.minCapacity;
            }
            if (filters.maxCapacity) {
                if (filters.maxCapacity < 0) {
                    throw new BadRequestException({
                        success: false,
                        message: 'Sức chứa tối đa không được âm',
                        errorCode: 'INVALID_MAX_CAPACITY'
                    });
                }
                query.capacity.$lte = filters.maxCapacity;
            }
        }

        // 4. Lọc theo trạng thái
        if (filters.status) {
            const validStatuses = ['available', 'occupied', 'maintenance'];
            if (!validStatuses.includes(filters.status)) {
                throw new BadRequestException({
                    success: false,
                    message: `Trạng thái không hợp lệ. Giá trị hợp lệ: ${validStatuses.join(', ')}`,
                    errorCode: 'INVALID_STATUS'
                });
            }
            query.status = filters.status;
        }

        // 5. Lọc theo thiết bị (máy chiếu)
        if (filters.hasProjector !== undefined) {
            query.devices = {
                $elemMatch: {
                    name: 'Máy chiếu',
                    quantity: { $gt: 0 }
                }
            };
        }

        // 6. Lọc theo tính năng (features)
        if (filters.features && filters.features.length > 0) {
            query.features = { $all: filters.features };
        }

        // 7. Lọc theo thời gian khả dụng (nếu cần)
        if (filters.fromDate || filters.toDate) {
            query.$and = [];

            if (filters.fromDate) {
                if (!this.isValidDate(filters.fromDate)) {
                    throw new BadRequestException({
                        success: false,
                        message: 'Ngày bắt đầu không hợp lệ (định dạng YYYY-MM-DD)',
                        errorCode: 'INVALID_FROM_DATE'
                    });
                }
                query.$and.push({
                    $or: [
                        { 'operatingHours.close': { $gte: filters.fromDate } },
                        { 'operatingHours.closedDays': { $nin: [this.getDayOfWeek(filters.fromDate)] } }
                    ]
                });
            }

            if (filters.toDate) {
                if (!this.isValidDate(filters.toDate)) {
                    throw new BadRequestException({
                        success: false,
                        message: 'Ngày kết thúc không hợp lệ (định dạng YYYY-MM-DD)',
                        errorCode: 'INVALID_TO_DATE'
                    });
                }
                query.$and.push({
                    $or: [
                        { 'operatingHours.open': { $lte: filters.toDate } },
                        { 'operatingHours.closedDays': { $nin: [this.getDayOfWeek(filters.toDate)] } }
                    ]
                });
            }
        }

        // Thực hiện truy vấn
        try {
            const skip = (page - 1) * limit;
            const [rooms, total] = await Promise.all([
                this.roomModel.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ name: 1 }) // Sắp xếp theo tên
                    .lean()
                    .exec(),
                this.roomModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                success: true,
                message: `Tìm thấy ${rooms.length} phòng phù hợp`,
                data: rooms as IRoom[],
                meta: {
                    total,
                    page,
                    limit,
                    totalPages,
                    appliedFilters: { ...filters }
                }
            };
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'Lỗi khi tìm kiếm phòng',
                errorCode: 'SEARCH_ERROR',
                details: error.message
            });
        }
    }

    // Helper functions
    private isValidDate(dateString: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    }

    private getDayOfWeek(dateString: string): string {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const date = new Date(dateString);
        return days[date.getDay()];
    }

}