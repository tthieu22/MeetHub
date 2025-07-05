import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './room.schema';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service'; 
import { IRoomService } from './interface/room.service.interface';
@Module({
    imports: [
        MongooseModule.forFeature([
        { name: 'Room', schema: RoomSchema },
        ]),
    ],
    controllers: [RoomsController],
    providers: [RoomsService],
    exports: [MongooseModule],
})
export class RoomsModule {}