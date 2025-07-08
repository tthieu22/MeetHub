import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '@api/gateway/chat.gateway';
import { MessageModule } from '@api/modules/chat-message/message.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoginResgisterModule } from './login-resgister/login-resgister.module';
import { UploadImageModule } from './modules/upload/upload.module';
import { BookingsModule } from './modules/booking/bookings.module';
import { ParticipationRequestsModule } from './modules/participation-requests/participation-requests.module';
import { RoomsModule } from './modules/rooms/rooms.module';
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
    AuthModule,
    RoomsModule,
    UsersModule,
    BookingsModule,
    ParticipationRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, MessageModule],
  exports: [ChatGateway],
})
export class AppModule {}
