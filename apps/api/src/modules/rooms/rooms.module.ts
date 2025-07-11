import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Room, RoomSchema } from './room.schema';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { ROOM_SERVICE_TOKEN } from './room.tokens';
import { AuthModule } from '@api/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
    ]),
    AuthModule,
    JwtModule ,
  ],
  controllers: [RoomsController],
  providers: [
    RoomsService,
    {
      provide: ROOM_SERVICE_TOKEN,
      useClass: RoomsService,
    },
  ],
 exports: [ROOM_SERVICE_TOKEN, MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }])],
})
export class RoomsModule {}