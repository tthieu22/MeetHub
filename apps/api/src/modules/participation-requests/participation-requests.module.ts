import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParticipationRequestsController } from './participation-requests.controller';
import { ParticipationRequestsService } from './participation-requests.service';
import { ParticipationRequest, ParticipationRequestSchema } from './schemas/participation-request.schema';
import { BookingsModule } from '../booking/bookings.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ParticipationRequest.name, schema: ParticipationRequestSchema }]),
    BookingsModule,
    UsersModule,
  ],
  controllers: [ParticipationRequestsController],
  providers: [ParticipationRequestsService],
  exports: [ParticipationRequestsService],
})
export class ParticipationRequestsModule {}