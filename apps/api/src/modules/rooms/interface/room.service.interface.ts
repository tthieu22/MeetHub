import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-rooms.dto';
import { IRoom } from './room.interface';

export interface IRoomService {
    createRoom(createRoomDto: CreateRoomDto): Promise<IRoom>;
    getAllRooms(page?: number, limit?: number, filter?: any): Promise<any>;
    getAvailableRooms(page?: number, limit?: number, filter?: any): Promise<any>;
    getRoomById(id: string): Promise<IRoom>;
    updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<IRoom>;
    deleteRoom(id: string): Promise<void>;
      searchRooms(filters: {
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
            appliedFilters: any;
        };
    }>;
    
    // Tìm kiếm phòng theo tên
    searchByName(name: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    
    // Thay đổi trạng thái phòng thành deleted (soft delete)
    statusChangeDeleteRoom(id: string): Promise<void>;
    
    // Lấy tất cả phòng đang hoạt động
    getAllActiveRooms(page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        data: IRoom[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
}