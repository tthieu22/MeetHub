import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '@api/gateway/chat.gateway';
import { MessageModule } from './modules/chat-message/message.module';
import { RoomModule } from './modules/chat-room/room.module';
import { NotificationModule } from './modules/chat-notification/notification.module';
import { UserChatModule } from './modules/chat-user/user-chat.module';
import { ReactionModule } from './modules/chat-reactions/reaction.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';

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
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway],
  exports: [ChatGateway],
})
export class AppModule {}
