import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    HttpCode,
    HttpStatus,
    Inject,
    Query,
    UseGuards,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { IRoomService } from './interface/room.service.interface';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { ROOM_SERVICE_TOKEN } from './room.tokens';
import { AuthGuard } from '@api/auth/auth.guard';
import { RolesGuard } from '@api/auth/roles.guard';
import { Roles } from '@api/auth/roles.decorator';
import { UserRole } from '@api/modules/users/schema/user.schema';
import { Room } from './room.schema';

@Controller('rooms')
export class RoomsController {
    constructor(
        @Inject(ROOM_SERVICE_TOKEN) private readonly roomService: IRoomService
    ) { }

    // thêm phòng họp mới
    @Post('/add-room')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() createRoomDto: CreateRoomDto) {
        const room = await this.roomService.createRoom(createRoomDto);
        return {
            success: true,
            data: room,
        };
    }

    // Lấy tất cả phòng họp có trạng thái active - Cả admin và user đều có thể dùng
    @Get('/active')
    @UseGuards(AuthGuard)
    async getAllActiveRooms(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const result = await this.roomService.getAllActiveRooms(page, limit);
        return result;
    }

    // Tìm kiếm phòng họp theo các tiêu chí như tên, địa điểm, số lượng người tối đa, trạng thái, có máy chiếu, cho phép mang đồ ăn, các tính năng khác chi tiết cho Admin
    @Get('/search')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async searchRooms(@Query() query: Record<string, string>) {
        const filters: any = {};
        if (query.keyword) filters.keyword = query.keyword;
        if (query.location) filters.location = query.location;
        if (query.status) filters.status = query.status;
        if (query.fromDate) filters.fromDate = query.fromDate;
        if (query.toDate) filters.toDate = query.toDate;
        if (query.minCapacity) filters.minCapacity = parseInt(query.minCapacity, 10);
        if (query.maxCapacity) filters.maxCapacity = parseInt(query.maxCapacity, 10);
        if (query.page) filters.page = parseInt(query.page, 10);
        if (query.limit) filters.limit = parseInt(query.limit, 10);
        if (query.hasProjector) filters.hasProjector = query.hasProjector === 'true';
        if (query.allowFood) filters.allowFood = query.allowFood === 'true';
        if (query.features) filters.features = query.features.split(',');
        const result = await this.roomService.searchRooms(filters);
        return result;
    }

    // Tìm kiếm phòng họp theo tên trừ phòng đã xóa của người dùng - Cả admin và user đều có thể dùng
    @Get('/activity')
    @UseGuards(AuthGuard)
    async findActivityRooms(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const result = await this.roomService.findActivityRooms(page, limit);
        return result;
    }

    // Lấy tất cả phòng họp hiện thị ở trang Admin
    // Có phân trang, lọc theo các trường như tên phòng, địa điểm, trạng thái, số lượng người tối đa
    @Get('/get-all-rooms')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAll(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('filter') filter: string = '{}'
    ) {
        const parsedFilter = JSON.parse(filter);
        const result = await this.roomService.getAllRooms(page, limit, parsedFilter);
        return result;
    }

    // Lấy tất cả phòng họp có trạng thái là available
    @Get('/available')
    @UseGuards(AuthGuard)
    async findAvailable(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('filter') filter: string = '{}'
    ) {
        const parsedFilter = JSON.parse(filter);
        const result = await this.roomService.getAvailableRooms(page, limit, parsedFilter);
        return result;
    }

    // Lấy thông tin chi tiết của một phòng họp theo ID
    @Get(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async findOne(@Param('id') id: string) {
        const room = await this.roomService.getRoomById(id);
        return {
            success: true,
            data: room,
        };
    }

    // Cập nhật thông tin phòng họp
    @Put(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        const updatedRoom = await this.roomService.updateRoom(id, updateRoomDto);
        return {
            success: true,
            data: updatedRoom,
        };
    }

    // Xóa phòng họp ( xoá vĩnh viễn )
    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.roomService.deleteRoom(id);
        return {
            success: true,
            message: 'Xóa phòng họp thành công',
        };
    }

    // Xóa mềm - Chuyển trạng thái phòng thành deleted
    @Get(':id/soft-delete')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async softDelete(@Param('id') id: string) {
        await this.roomService.statusChangeDeleteRoom(id);
        return {
            success: true,
            message: 'Chuyển trạng thái phòng thành đã xóa thành công',
        };
    }
}