import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room , RoomSchema } from './room.schema';

@Injectable()
export class RoomsService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

  async create(createRoomDto: any): Promise<Room> {
    const createdRoom = new this.roomModel(createRoomDto);
    return createdRoom.save();
  }

  async findAll(): Promise<Room[]> {
    return this.roomModel.find().exec();
  }

  async findOne(id: string): Promise<Room | null> {
    return this.roomModel.findById(id).exec();
  }

  async update(id: string, updateRoomDto: any): Promise<Room | null> {
    return this.roomModel.findByIdAndUpdate(id, updateRoomDto, { new: true }).exec();
  }

  async delete(id: string): Promise<any> {
    return this.roomModel.findByIdAndDelete(id).exec();
  }
}