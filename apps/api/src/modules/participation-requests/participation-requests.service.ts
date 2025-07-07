import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateParticipationRequestDto } from './dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from './dto/update-participation-request.dto';
import { ParticipationRequest, RequestStatus } from './schemas/participation-request.schema';
import { IParticipationRequestService } from './interface/participation-request.service.interface';
import { Booking } from '../booking/booking.schema';
import { User } from '../users/schema/user.schema';

@Injectable()
export class ParticipationRequestsService implements IParticipationRequestService {
  constructor(
    @InjectModel(ParticipationRequest.name) private participationRequestModel: Model<ParticipationRequest>,
    @InjectModel(Booking.name) private bookingModel: Model<Booking>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createDto: CreateParticipationRequestDto): Promise<ParticipationRequest> {
    const booking = await this.bookingModel.findById(createDto.booking);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const user = await this.userModel.findById(createDto.user);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingRequest: ParticipationRequest | null = await this.participationRequestModel.findOne({
      booking: createDto.booking,
      user: createDto.user,
    });

    if (existingRequest) {
      throw new BadRequestException('Participation request already exists');
    }

    const createdRequest = new this.participationRequestModel(createDto);
    return createdRequest.save();
  }

  async findAll(): Promise<ParticipationRequest[]> {
    return this.participationRequestModel.find().populate('booking user approvedBy').exec();
  }

  async findOne(id: string): Promise<ParticipationRequest> {
    const request = await this.participationRequestModel.findById(id).populate('booking user approvedBy').exec();
    if (!request) {
      throw new NotFoundException(`Participation request with ID ${id} not found`);
    }
    return request;
  }

  async update(id: string, updateDto: UpdateParticipationRequestDto): Promise<ParticipationRequest> {
    const request = await this.participationRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException(`Participation request with ID ${id} not found`);
    }

    if (updateDto.status) {
      request.status = updateDto.status;
    }

    if (updateDto.approvedBy) {
      const approver = await this.userModel.findById(updateDto.approvedBy);
      if (!approver) {
        throw new NotFoundException('Approver user not found');
      }
      request.approvedBy = approver;
    }

    return request.save();
  }

  async remove(id: string): Promise<void> {
    const result = await this.participationRequestModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Participation request with ID ${id} not found`);
    }
  }

  async approveRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    const request = await this.participationRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException(`Participation request with ID ${id} not found`);
    }

    const approver = await this.userModel.findById(approverId);
    if (!approver) {
      throw new NotFoundException('Approver not found');
    }

    const booking = await this.bookingModel.findById(request.booking);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.user.toString() !== approverId) {
      throw new BadRequestException('Only the booking creator can approve requests');
    }

    request.status = RequestStatus.ACCEPTED;
    request.approvedBy = approver;

    if (!booking.participants.includes(request.user)) {
      booking.participants.push(request.user);
      await booking.save();
    }

    return request.save();
  }

  async rejectRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    const request = await this.participationRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException(`Participation request with ID ${id} not found`);
    }

    const approver = await this.userModel.findById(approverId);
    if (!approver) {
      throw new NotFoundException('Approver not found');
    }

    const booking = await this.bookingModel.findById(request.booking);
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.user.toString() !== approverId) {
      throw new BadRequestException('Only the booking creator can reject requests');
    }

    request.status = RequestStatus.REJECTED;
    request.approvedBy = approver;

    return request.save();
  }
}