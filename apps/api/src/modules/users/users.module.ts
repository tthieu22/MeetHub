import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from './schema/user.schema';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecret',
      signOptions: { expiresIn: '7h' },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
   exports: [UsersService, MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])], // Xuất UserModel
})
export class UsersModule {}
