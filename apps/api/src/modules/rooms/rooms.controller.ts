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
    ) {}

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
}