import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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
    try {
      // Validate MongoDB ObjectId format
      if (!Types.ObjectId.isValid(createDto.booking)) {
        throw new BadRequestException('Invalid booking ID format');
      }
      
      if (!Types.ObjectId.isValid(createDto.user)) {
        throw new BadRequestException('Invalid user ID format');
      }

      // Check if booking exists
      const booking = await this.bookingModel.findById(createDto.booking).exec();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Check if user exists
      const user = await this.userModel.findById(createDto.user).exec();
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if user is trying to join their own booking
      if (booking.user.toString() === createDto.user) {
        throw new BadRequestException('Cannot request to join your own booking');
      }

      // Check if request already exists
      const existingRequest = await this.participationRequestModel.findOne({
        booking: createDto.booking,
        user: createDto.user,
      }).exec();

      if (existingRequest) {
        throw new BadRequestException('Participation request already exists');
      }

      // Check if user is already a participant
      const isAlreadyParticipant = booking.participants.some(
        participantId => participantId.toString() === createDto.user
      );

      if (isAlreadyParticipant) {
        throw new BadRequestException('User is already a participant in this booking');
      }

      // Create the request
      const createdRequest = new this.participationRequestModel({
        booking: new Types.ObjectId(createDto.booking),
        user: new Types.ObjectId(createDto.user),
        status: RequestStatus.PENDING
      });

      const savedRequest = await createdRequest.save();
      
      // Populate and return
      const populatedRequest = await this.participationRequestModel
        .findById(savedRequest._id)
        .populate('booking user approvedBy')
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException('Participation request not found after creation');
      }

      return populatedRequest;
        
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create participation request: ' + error.message);
    }
  }

  async findAll(): Promise<ParticipationRequest[]> {
    try {
      return await this.participationRequestModel
        .find()
        .populate('booking user approvedBy')
        .exec();
    } catch (error) {
      throw new BadRequestException('Failed to fetch participation requests: ' + error.message);
    }
  }

  async findOne(id: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participation request ID format');
      }

      const request = await this.participationRequestModel
        .findById(id)
        .populate('booking user approvedBy')
        .exec();
        
      if (!request) {
        throw new NotFoundException(`Participation request with ID ${id} not found`);
      }
      
      return request;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch participation request: ' + error.message);
    }
  }

  async update(id: string, updateDto: UpdateParticipationRequestDto): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participation request ID format');
      }

      const request = await this.participationRequestModel.findById(id).exec();
      if (!request) {
        throw new NotFoundException(`Participation request with ID ${id} not found`);
      }

      if (updateDto.status) {
        request.status = updateDto.status;
      }

      if (updateDto.approvedBy) {
        if (!Types.ObjectId.isValid(updateDto.approvedBy)) {
          throw new BadRequestException('Invalid approver ID format');
        }
        
        const approver = await this.userModel.findById(updateDto.approvedBy).exec();
        if (!approver) {
          throw new NotFoundException('Approver user not found');
        }
        request.approvedBy = approver;
      }

      const updatedRequest = await request.save();
      
      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException('Participation request not found after update');
      }

      return populatedRequest;
        
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update participation request: ' + error.message);
    }
  }

  async remove(id: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participation request ID format');
      }

      const result = await this.participationRequestModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Participation request with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete participation request: ' + error.message);
    }
  }

  async approveRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participation request ID format');
      }
      
      if (!Types.ObjectId.isValid(approverId)) {
        throw new BadRequestException('Invalid approver ID format');
      }

      const request = await this.participationRequestModel.findById(id).exec();
      if (!request) {
        throw new NotFoundException(`Participation request with ID ${id} not found`);
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Request has already been processed');
      }

      const approver = await this.userModel.findById(approverId).exec();
      if (!approver) {
        throw new NotFoundException('Approver not found');
      }

      const booking = await this.bookingModel.findById(request.booking).exec();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.user.toString() !== approverId) {
        throw new BadRequestException('Only the booking creator can approve requests');
      }

      request.status = RequestStatus.ACCEPTED;
      request.approvedBy = approver;

      // Add user to participants if not already added
      if (!booking.participants.includes(request.user)) {
        booking.participants.push(request.user);
        await booking.save();
      }

      const updatedRequest = await request.save();
      
      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException('Participation request not found after approval');
      }

      return populatedRequest;
        
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to approve participation request: ' + error.message);
    }
  }

  async rejectRequest(id: string, approverId: string): Promise<ParticipationRequest> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException('Invalid participation request ID format');
      }
      
      if (!Types.ObjectId.isValid(approverId)) {
        throw new BadRequestException('Invalid approver ID format');
      }

      const request = await this.participationRequestModel.findById(id).exec();
      if (!request) {
        throw new NotFoundException(`Participation request with ID ${id} not found`);
      }

      if (request.status !== RequestStatus.PENDING) {
        throw new BadRequestException('Request has already been processed');
      }

      const approver = await this.userModel.findById(approverId).exec();
      if (!approver) {
        throw new NotFoundException('Approver not found');
      }

      const booking = await this.bookingModel.findById(request.booking).exec();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.user.toString() !== approverId) {
        throw new BadRequestException('Only the booking creator can reject requests');
      }

      request.status = RequestStatus.REJECTED;
      request.approvedBy = approver;

      const updatedRequest = await request.save();
      
      const populatedRequest = await this.participationRequestModel
        .findById(updatedRequest._id)
        .populate('booking user approvedBy')
        .exec();

      if (!populatedRequest) {
        throw new NotFoundException('Participation request not found after rejection');
      }

      return populatedRequest;
        
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to reject participation request: ' + error.message);
    }
  }
}