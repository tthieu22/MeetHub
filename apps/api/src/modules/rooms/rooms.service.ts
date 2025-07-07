import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './room.schema';
import { IRoomService } from './interface/room.service.interface';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-rooms.dto';
import { IRoom } from './interface/room.interface';

@Injectable()
export class RoomsService implements IRoomService {
  constructor(@InjectModel(Room.name) private roomModel: Model<Room>) { }

  async createRoom(createRoomDto: CreateRoomDto): Promise<IRoom> {
    const createdRoom = new this.roomModel(createRoomDto);
    const savedRoom = await createdRoom.save();
    return savedRoom.toObject() as IRoom;
  }

  async getAllRooms(): Promise<IRoom[]> {
    return this.roomModel.find().lean().exec() as Promise<IRoom[]>;
  }

  async getAvailableRooms(): Promise<IRoom[]> {
    return this.roomModel.find({ status: 'available' }).lean().exec() as Promise<IRoom[]>;
  }

  async getRoomById(id: string): Promise<IRoom> {
    const room = await this.roomModel.findById(id).exec();
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room.toObject() as IRoom;
  }

  async updateRoom(id: string, updateRoomDto: UpdateRoomDto): Promise<IRoom> {
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, updateRoomDto, { new: true })
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return updatedRoom as IRoom;
  }

  async deleteRoom(id: string): Promise<void> {
    const result = await this.roomModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  async findRoomByName(name: string): Promise<IRoom | null> {
    return this.roomModel.findOne({ name }).lean().exec() as Promise<IRoom | null>;
  }

  async setRoomActiveStatus(id: string, isActive: boolean): Promise<IRoom> {
    const updatedRoom = await this.roomModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();

    if (!updatedRoom) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return updatedRoom.toObject() as IRoom;
  }

  // Giữ lại các methods cũ để backward compatibility
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