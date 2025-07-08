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
}