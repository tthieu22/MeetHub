import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { MongooseModule } from '@nestjs/mongoose';

import { GatewayModule } from '@api/gateway/gateway.module';

import { MessageModule } from './modules/chat/chat-message/message.module';
import { RoomModule } from './modules/chat/chat-room/room.module';
import { NotificationModule } from './modules/chat/chat-notification/notification.module';
import { UserChatModule } from './modules/chat/chat-user/user-chat.module';
import { ReactionModule } from './modules/chat/chat-reactions/reaction.module';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './modules/redis';
import { RoomsModule } from '@api/modules/rooms/rooms.module';
import { BookingsModule } from './modules/booking/bookings.module';
import { ParticipationRequestsModule } from './modules/participation-requests/participation-requests.module';
import { LoginResgisterModule } from './login-resgister/login-resgister.module';
import { UploadImageModule } from './modules/upload/upload.module';
import { PasswordResetModule } from './modules/password-reset/password-reset.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGODB_URI'),
      }),
    }),
    UsersModule,
    MessageModule,
    RoomModule,
    NotificationModule,
    UserChatModule,
    ReactionModule,
    AuthModule,
    GatewayModule,
    RedisModule,
    RoomsModule,
    BookingsModule,
    ParticipationRequestsModule,
    LoginResgisterModule,
    UploadImageModule,
    PasswordResetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
