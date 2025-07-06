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
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { IRoomService } from './interface/room.service.interface';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { ROOM_SERVICE_TOKEN } from './room.tokens';

@Controller('rooms')
export class RoomsController {
    constructor(
        @Inject(ROOM_SERVICE_TOKEN) private readonly roomService: IRoomService
    ) {}

    @Post()
    async create(@Body() createRoomDto: CreateRoomDto) {
        return this.roomService.createRoom(createRoomDto);
    }

    @Get()
    async findAll() {
        return this.roomService.getAllRooms();
    }

    @Get('available')
    async findAvailable() {
        return this.roomService.getAvailableRooms();
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.roomService.getRoomById(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
        return this.roomService.updateRoom(id, updateRoomDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.roomService.deleteRoom(id);
    }
}