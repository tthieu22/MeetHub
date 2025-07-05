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
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { IRoomService } from './interface/room.service.interface';
// import { UpdateRoomDto } from 'C:/Users/DELL/Documents/DHVB/MeetHub/apps/api/src/modules/rooms/dtos/update-room.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';

@Controller('rooms')
export class RoomsController {
    constructor(private readonly roomService: IRoomService) { }

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
    async update(@Param('id') id: string, @Body() UpdateRoomDto: UpdateRoomDto) {
        return this.roomService.updateRoom(id, UpdateRoomDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id') id: string) {
        await this.roomService.deleteRoom(id);
    }
}