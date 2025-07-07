import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserRole } from './schema/user.schema';
import { Model } from 'mongoose';

import { hashPassword } from '@api/utils/brcrypt.password';
import { RegisterDto } from '../../login-resgister/dto/register.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userDocumentModel: Model<UserDocument>) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const passwordBr = await hashPassword(createUserDto.password);
      // createUserDto.password = passwordBr;
      const user = new this.userDocumentModel({
        ...createUserDto,
        password: passwordBr,
      });

      return await user.save();
    } catch (error) {
      if (error.code === 11000 && error.keyPattern?.email) {
        throw new BadRequestException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const data = await this.userDocumentModel.find();

      return {
        success: true,

        data,
      };
    } catch (error) {
      throw error;
    }
  }

  async findOne(email: string) {
    const user = await this.userDocumentModel.findOne({ email }).exec();
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      const updatedUser = await this.userDocumentModel.findByIdAndUpdate(id, updateUserDto, { new: true });
      if (!updatedUser) {
        throw new BadRequestException(`User with id #${id} not found`);
      }
      return updatedUser;
    } catch (error) {
      throw error;
    }
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
  async activateUser(email: string) {
    return this.userDocumentModel.updateOne({ email }, { isActive: true });
  }
}
