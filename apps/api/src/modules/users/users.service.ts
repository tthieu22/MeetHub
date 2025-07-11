import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';

import { hashPassword } from '@api/utils/brcrypt.password';
import { UpdateMeDto } from './dto/update-user-me.dto';

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
    try {
      const user = await this.userDocumentModel.findOne({ email }).exec();
      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const data = await this.userDocumentModel.findByIdAndUpdate(id, { $set: updateUserDto }, { new: true });

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('❌ Update error:', error);
      throw new InternalServerErrorException('Lỗi khi cập nhật người dùng');
    }
  }

  async remove(id: string) {
    try {
      const data = await this.userDocumentModel.updateOne({ _id: id }, { isActive: false });
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }
  async activateUser(email: string) {
    return this.userDocumentModel.updateOne({ email }, { isActive: true });
  }
  async findById(id: string) {
    try {
      return this.userDocumentModel.findById(id).select('-password');
    } catch (error) {
      console.log(error);
      throw new BadRequestException('lỗi không tim thấy người dùng');
    }
  }

  async updateMe(id: string, dto: UpdateMeDto) {
    try {
      return this.userDocumentModel
        .findByIdAndUpdate(id, dto, {
          new: true,
          runValidators: true,
        })
        .select('-password');
    } catch (error) {
      throw new BadRequestException('lỗi không cập nhật được người dùng');
    }
  }
}
