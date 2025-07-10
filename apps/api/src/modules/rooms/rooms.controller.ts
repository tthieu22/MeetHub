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

@Controller('rooms')
export class RoomsController {
    constructor(
        @Inject(ROOM_SERVICE_TOKEN) private readonly roomService: IRoomService
    ) { }

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

    @Get('/get-all-rooms')
    @UseGuards(AuthGuard)
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

    @Get(':id')
    @UseGuards(AuthGuard)
    async findOne(@Param('id') id: string) {
        const room = await this.roomService.getRoomById(id);
        return {
            success: true,
            data: room,
        };
    }

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

    @Delete(':id')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.roomService.deleteRoom(id);
        return { success: true };
    }
    // Xóa mềm - Chuyển trạng thái phòng thành deleted
    @Get(':id/soft-delete')
    @UseGuards(AuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async softDelete(@Param('id') id: string) {
        await this.roomService.statusChangeDeleteRoom(id);
        return {
            success: true,
            message: 'Chuyển trạng thái phòng thành đã xóa thành công'
        };
    }

    @Get('active')
    @UseGuards(AuthGuard)
    async getAllActiveRooms(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const result = await this.roomService.getAllActiveRooms(page, limit);
        return result;
    }

    @Get('search')
    @UseGuards(AuthGuard)
    async searchRooms(@Query() query: Record<string, string>) {
        // Chuẩn bị filters từ query parameters
        const filters: any = {};

        // Xử lý các tham số đơn giản (keyword, location, status, dates)
        if (query.keyword) filters.keyword = query.keyword;
        if (query.location) filters.location = query.location;
        if (query.status) filters.status = query.status;
        if (query.fromDate) filters.fromDate = query.fromDate;
        if (query.toDate) filters.toDate = query.toDate;

        // Xử lý các tham số số (minCapacity, maxCapacity, page, limit)
        if (query.minCapacity) filters.minCapacity = parseInt(query.minCapacity, 10);
        if (query.maxCapacity) filters.maxCapacity = parseInt(query.maxCapacity, 10);
        if (query.page) filters.page = parseInt(query.page, 10);
        if (query.limit) filters.limit = parseInt(query.limit, 10);

        // Xử lý các tham số boolean (hasProjector, allowFood)
        if (query.hasProjector) filters.hasProjector = query.hasProjector === 'true';
        if (query.allowFood) filters.allowFood = query.allowFood === 'true';

        // Xử lý mảng features
        if (query.features) filters.features = query.features.split(',');

        // Gọi service để xử lý tìm kiếm (service sẽ chịu trách nhiệm validate)
        const result = await this.roomService.searchRooms(filters);
        return result;
    }

    @Get('activity')
    @UseGuards(AuthGuard)
    async findActivityRooms(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10
    ) {
        const result = await this.roomService.findActivityRooms(page, limit);
        return result;
    }

}