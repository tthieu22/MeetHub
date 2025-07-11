import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schema/user.schema';
import { Model } from 'mongoose';

import { hashPassword } from '@api/utils/brcrypt.password';
import { UpdateMeDto } from './dto/update-user-me.dto';

function isMongoDuplicateEmailError(error: unknown): error is { code: number; keyPattern: { email?: unknown } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000 &&
    'keyPattern' in error &&
    Boolean((error as { keyPattern?: { email?: unknown } }).keyPattern?.email)
  );
}

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
      if (isMongoDuplicateEmailError(error)) {
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
      throw error;
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
      throw error;
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
      throw error;
    }
  }
}
