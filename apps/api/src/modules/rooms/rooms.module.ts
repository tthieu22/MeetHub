import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './room.schema';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { ROOM_SERVICE_TOKEN } from './room.tokens';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
    ]),
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    {
      provide: ROOM_SERVICE_TOKEN,
      useClass: RoomsService,
    },
  ],
  exports: [MongooseModule, ROOM_SERVICE_TOKEN],
})
export class RoomsModule {}