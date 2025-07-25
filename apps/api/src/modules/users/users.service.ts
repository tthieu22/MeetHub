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

      const res = await user.save();
      return {
        success: true,
        data: res,
      };
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
  async findByFilter(queryParams: any): Promise<{
    success: boolean;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    data: UserDocument[];
  }> {
    try {
      const {
        page = 1,
        limit = 500,
        sort = '{"createdAt": -1}', // Mặc định sort mới
        ...filters
      } = queryParams as { page?: number; limit?: number; sort?: string; [key: string]: any };
      let sortObj: Record<string, 1 | -1>;
      try {
        sortObj = typeof sort === 'string' ? JSON.parse(sort) : sort;
      } catch {
        sortObj = { createdAt: -1 };
      }
      const availablePaths = this.userDocumentModel.schema.paths;
      for (const key of Object.keys(sortObj)) {
        if (!availablePaths[key]) {
          delete sortObj[key];
        }
      }
      // Nếu không còn field nào thì sort mặc định
      if (Object.keys(sortObj).length === 0) {
        sortObj = { createdAt: -1 };
      }

      const pageNum = Math.max(Number(page) || 1, 1);
      const limitNum = Math.max(Number(limit) || 10, 1);
      const skip = (pageNum - 1) * limitNum;

      const filterObj = { ...filters };
      const [data, totalRecords] = await Promise.all([this.userDocumentModel.find(filterObj).sort(sortObj).skip(skip).limit(limitNum).exec(), this.userDocumentModel.countDocuments(filterObj)]);

      const totalPages = Math.ceil(totalRecords / limitNum);

      return {
        success: true,
        total: totalRecords,
        page: pageNum,
        limit: limitNum,
        totalPages,
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
