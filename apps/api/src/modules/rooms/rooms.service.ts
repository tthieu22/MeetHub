import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';
import { IRoomService } from './interface/room.service.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { IRoom } from './interface/room.interface';
import { isString } from 'class-validator';

@Injectable()
export class RoomsService implements IRoomService {
    constructor(@InjectModel(Room.name) private roomModel: Model<Room>) { }

    /**
     * Tạo một phòng họp mới
     * @param createRoomDto Dữ liệu tạo phòng
     * @returns Thông tin phòng đã tạo
     * @throws BadRequestException nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc
     */
    async createRoom(createRoomDto: CreateRoomDto): Promise<IRoom> {
        try {
            // Validate capacity trước khi tạo
            if (createRoomDto.capacity < 6) {
                throw new BadRequestException({
                    success: false,
                    message: 'Sức chứa phòng phải lớn hơn 5 người',
                    errorCode: 'INVALID_CAPACITY'
                });
            }

            // Validate location trước khi tạo
            // if (createRoomDto.location === 'tầng 1704 - tầng 17 - 19 Tố Hữu') {
            //     throw new BadRequestException({
            //         success: false,
            //         message: 'Vị trí phòng không hợp lệ',
            //         errorCode: 'INVALID_LOCATION'
            //     });
            // }

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
            
            // Nếu là lỗi đã throw từ validation ở trên, throw lại
            if (error instanceof BadRequestException) {
                throw error;
            }
            
            throw error;
        }
    }

    /**
     * Lấy danh sách tất cả các phòng họp với phân trang và lọc
     * @param page Số trang
     * @param limit Giới hạn số lượng phòng trên mỗi trang
     * @param filter Bộ lọc tùy chọn
     * @returns Danh sách các phòng họp
     */
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

    /**
     * Lấy danh sách các phòng họp có trạng thái là 'available'
     * @param page Số trang
     * @param limit Giới hạn số lượng phòng trên mỗi trang
     * @param filter Bộ lọc tùy chọn
     * @returns Danh sách các phòng họp có trạng thái 'available'
     */
    async getAvailableRooms(page: number = 1, limit: number = 10, filter: any = {}): Promise<any> {
        const availableFilter = { ...filter, status: 'available' };
        return this.getAllRooms(page, limit, availableFilter);
    }

    /**
     * Lấy thông tin phòng họp theo ID
     * @param id ID của phòng cần lấy thông tin
     * @returns Thông tin phòng họp
     * @throws NotFoundException nếu không tìm thấy phòng với ID tương ứng
     */
    async getRoomById(id: string): Promise<IRoom> {
        const room = await this.roomModel.findById(id).lean().exec();
        if (!room) {
            throw new NotFoundException({
                success: false,
                message: `Không tìm thấy mã phòng ${id}`,
            });
        }
        return room as IRoom;
    }

    /**
     * Cập nhật thông tin phòng họp
     * @param id ID của phòng cần cập nhật
     * @param updateRoomDto Dữ liệu cập nhật
     * @returns Thông tin phòng đã cập nhật
     * @throws NotFoundException nếu không tìm thấy phòng với ID tương ứng
     * @throws BadRequestException nếu dữ liệu không hợp lệ hoặc vi phạm ràng buộc
     */
    async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<IRoom> {
        try {
            // Validate capacity nếu được cung cấp
            if (updateRoomDto.capacity !== undefined && updateRoomDto.capacity < 6) {
                throw new BadRequestException({
                    success: false,
                    message: 'Sức chứa phòng phải lớn hơn 5 người',
                    errorCode: 'INVALID_CAPACITY'
                });
            }

            // Validate location nếu được cung cấp
            // if (updateRoomDto.location === 'tầng 1704 - tầng 17 - 19 Tố Hữu') {
            //     throw new BadRequestException({
            //         success: false,
            //         message: 'Vị trí phòng không hợp lệ',
            //         errorCode: 'INVALID_LOCATION'
            //     });
            // }

            // Validate status nếu được cung cấp
            if (updateRoomDto.status === 'Deleted') {
                throw new BadRequestException({
                    success: false,
                    message: 'Không thể cập nhật trạng thái phòng thành "Deleted"',
                    errorCode: 'INVALID_STATUS'
                });
            }

            // Kiểm tra tên phòng trùng lặp nếu được cung cấp
            if (updateRoomDto.name) {
                const existingRoom = await this.roomModel.findOne({ 
                    name: updateRoomDto.name, 
                    _id: { $ne: id } 
                }).exec();
                if (existingRoom) {
                    throw new BadRequestException({
                        success: false,
                        message: `Phòng với tên ${updateRoomDto.name} đã tồn tại`,
                    });
                }
            }

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

            // Nếu là lỗi đã throw từ validation ở trên, throw lại
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }

            throw error;
        }
    }

    /**
     * Xóa phòng họp theo ID
     * @param id ID của phòng cần xóa
     * @returns void
     * @throws NotFoundException nếu không tìm thấy phòng với ID tương ứng
     */
    async deleteRoom(id: string): Promise<void> {
        // Validate ID
        if (!id || id.trim() === '') {
            throw new BadRequestException({
                success: false,
                message: 'ID phòng không hợp lệ',
                errorCode: 'INVALID_ROOM_ID'
            });
        }

        const result = await this.roomModel.findByIdAndDelete(id).exec();
        
        if (!result) {
            throw new NotFoundException({
                success: false,
                message: `Không tìm thấy phòng với mã ${id}`,
            });
        }
    }

    /**
     * Tìm kiếm phòng họp theo các tiêu chí
     * @param filters Các bộ lọc tìm kiếm
     * @returns Danh sách các phòng phù hợp với bộ lọc
     */
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
            const validStatuses = ['available', 'occupied', 'maintenance', 'cleaning'];
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

        // 6. Lọc theo cho phép đồ ăn
        if (filters.allowFood !== undefined) {
            query.allowFood = filters.allowFood;
        }

        // 7. Lọc theo tính năng (features)
        if (filters.features && filters.features.length > 0) {
            query.features = { $all: filters.features };
        }

        // 8. Lọc theo thời gian khả dụng (nếu cần)
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

    /**
     * Kiểm tra định dạng ngày hợp lệ (YYYY-MM-DD)
     * @param dateString Chuỗi ngày cần kiểm tra
     * @returns true nếu định dạng hợp lệ, false nếu không hợp lệ
     */
    private isValidDate(dateString: string): boolean {
        return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
    }

    /**
     * Lấy ngày trong tuần từ chuỗi ngày (YYYY-MM-DD)
     * @param dateString Chuỗi ngày cần lấy ngày trong tuần
     * @returns Ngày trong tuần (viết tắt: 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat')
     */
    private getDayOfWeek(dateString: string): string {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const date = new Date(dateString);
        return days[date.getDay()];
    }

    /**
     * Tìm kiếm phòng họp theo tên
     * @param name Tên phòng cần tìm kiếm
     * @param page Số trang
     * @param limit Giới hạn số lượng phòng trên mỗi trang
     * @returns Danh sách các phòng phù hợp với tên tìm kiếm
     */
    async searchByName(name: string, page: number = 1, limit: number = 10): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        if (!name || name.trim().length < 2) {
            throw new BadRequestException({
                success: false,
                message: 'Tên phòng phải có ít nhất 2 ký tự',
                errorCode: 'INVALID_SEARCH_TERM'
            });
        }

        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                success: false,
                message: 'Số trang và giới hạn phải lớn hơn 0',
                errorCode: 'INVALID_PAGINATION'
            });
        }

        const regex = new RegExp(name, 'i'); // Case-insensitive search
        const query = {
            name: { $regex: regex },
            status: { $ne: 'deleted' } // Exclude deleted rooms
        };

        try {
            const [rooms, total] = await Promise.all([
                this.roomModel.find(query)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .lean()
                    .exec(),
                this.roomModel.countDocuments(query)
            ]);

            return {
                success: true,
                message: `Tìm thấy ${rooms.length} phòng phù hợp`,
                data: rooms as IRoom[],
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'Lỗi khi tìm kiếm phòng theo tên',
                errorCode: 'SEARCH_BY_NAME_ERROR',
                details: error.message
            });
        }
    }

    /**
     * Lấy danh sách tất cả các phòng đang hoạt động (trừ phòng đã xóa)
     * @param page Số trang
     * @param limit Giới hạn số lượng phòng trên mỗi trang
     * @returns Danh sách các phòng đang hoạt động
     */
    async getAllActiveRooms(page: number = 1, limit: number = 10): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                success: false,
                message: 'Số trang và giới hạn phải lớn hơn 0',
                errorCode: 'INVALID_PAGINATION'
            });
        }

        const query = {
            status: { $ne: 'deleted' },
            isActive: true
        };

        try {
            const [rooms, total] = await Promise.all([
                this.roomModel.find(query)
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .sort({ name: 1 })
                    .lean()
                    .exec(),
                this.roomModel.countDocuments(query)
            ]);

            return {
                success: true,
                message: `Lấy danh sách ${rooms.length} phòng đang hoạt động`,
                data: rooms as IRoom[],
                meta: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'Lỗi khi lấy danh sách phòng hoạt động',
                errorCode: 'GET_ACTIVE_ROOMS_ERROR',
                details: error.message
            });
        }
    }

    /**
     * Thay đổi trạng thái phòng thành 'deleted' (soft delete)
     * @param id ID của phòng cần thay đổi trạng thái
     */
    async statusChangeDeleteRoom(id: string): Promise<void> {
        // Validate ID
        if (!id || id.trim() === '' || !isString(id)) {
            throw new BadRequestException({
                success: false,
                message: 'ID phòng không hợp lệ',
                errorCode: 'INVALID_ROOM_ID'
            });
        }

        try {
            // Thay vì xóa, cập nhật trạng thái thành 'deleted'
            const updatedRoom = await this.roomModel.findByIdAndUpdate(
                id,
                {
                    status: 'deleted',
                    isActive: false
                },
                { new: true }
            ).exec();

            if (!updatedRoom) {
                throw new NotFoundException({
                    success: false,
                    message: `Phòng với mã ${id} không tìm thấy`,
                });
            }
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            
            throw new BadRequestException({
                success: false,
                message: 'Lỗi khi chuyển trạng thái phòng',
                errorCode: 'STATUS_CHANGE_ERROR',
                details: error.message
            });
        }
    }

    /**
     * Tìm kiếm các phòng đang hoạt động trừ những phòng ở trạng thái xóa
     * @param page Số trang
     * @param limit Giới hạn số lượng phòng trên mỗi trang
     * @returns Danh sách các phòng đang hoạt động
     */
    async findActivityRooms(page: number = 1, limit: number = 10): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }> {
        // Validate pagination
        if (page < 1 || limit < 1) {
            throw new BadRequestException({
                success: false,
                message: 'Số trang và giới hạn bản ghi phải lớn hơn 0',
                errorCode: 'INVALID_PAGINATION'
            });
        }

        const query = {
            status: { $ne: 'deleted' },
            isActive: true
        };

        try {
            const skip = (page - 1) * limit;
            const [rooms, total] = await Promise.all([
                this.roomModel.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ bookingCount: -1, name: 1 })
                    .lean()
                    .exec(),
                this.roomModel.countDocuments(query)
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                success: true,
                message: `Tìm thấy ${rooms.length} phòng đang hoạt động`,
                data: rooms as IRoom[],
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            };
        } catch (error) {
            throw new BadRequestException({
                success: false,
                message: 'Lỗi khi tìm kiếm phòng đang hoạt động',
                errorCode: 'SEARCH_ACTIVITY_ERROR',
                details: error.message
            });
        }
    }
}