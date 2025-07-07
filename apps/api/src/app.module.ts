import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from '@api/app.controller';
import { AppService } from '@api/app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGateway } from '@api/gateway/chat.gateway';
import { MessageModule } from '@api/modules/message/message.module';
import { RoomsModule } from '@api/modules/rooms/rooms.module';
import { UsersModule } from './modules/users/users.module';
import { BookingsModule } from './modules/booking/bookings.module';
import { ParticipationRequestsModule } from './modules/participation-requests/participation-requests.module';
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
    RoomsModule,
    UsersModule,
    BookingsModule,
    ParticipationRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ChatGateway, MessageModule  ],
  exports: [ChatGateway],
})
export class AppModule {}
