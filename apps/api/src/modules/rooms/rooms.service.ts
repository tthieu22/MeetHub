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
}