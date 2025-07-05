import { CreateRoomDto } from '../dto/create-room.dto';
import { UpdateRoomDto } from '../dto/update-rooms.dto';
import { IRoom } from './room.interface'; // Sử dụng interface thay vì entity

export interface IRoomService {
    /**
     * Tạo phòng mới
     * @param createRoomDto Dữ liệu tạo phòng
     * @returns Phòng đã được tạo
     */
    createRoom(createRoomDto: CreateRoomDto): Promise<IRoom>;

    /**
     * Lấy tất cả phòng
     * @returns Danh sách tất cả phòng
     */
    getAllRooms(): Promise<IRoom[]>;

    /**
     * Lấy các phòng có sẵn (available)
     * @returns Danh sách phòng có sẵn
     */
    getAvailableRooms(): Promise<IRoom[]>;

    /**
     * Lấy thông tin phòng theo ID
     * @param id ID của phòng
     * @returns Thông tin chi tiết phòng
     * @throws NotFoundException nếu không tìm thấy phòng
     */
    getRoomById(id: string): Promise<IRoom>;

    /**
     * Cập nhật thông tin phòng
     * @param id ID của phòng cần cập nhật
     * @param updateRoomDto Dữ liệu cập nhật
     * @returns Phòng đã được cập nhật
     * @throws NotFoundException nếu không tìm thấy phòng
     */
    updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<IRoom>;

    /**
     * Xóa phòng
     * @param id ID của phòng cần xóa
     * @throws NotFoundException nếu không tìm thấy phòng
     */
    deleteRoom(id: string): Promise<void>;

    /**
     * Tìm phòng theo tên
     * @param name Tên phòng
     * @returns Thông tin phòng nếu tìm thấy
     */
    findRoomByName(name: string): Promise<IRoom | null>;

    /**
     * Kích hoạt/vô hiệu hóa phòng
     * @param id ID phòng
     * @param isActive Trạng thái kích hoạt
     */
    setRoomActiveStatus(id: string, isActive: boolean): Promise<IRoom>;
}
