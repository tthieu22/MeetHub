import { CreateParticipationRequestDto } from '../dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from '../dto/update-participation-request.dto';
import { IParticipationRequest } from './participation-request.interface';

export interface IParticipationRequestService {
  create(createDto: CreateParticipationRequestDto): Promise<IParticipationRequest>;
  findAll(): Promise<IParticipationRequest[]>;
  findOne(id: string): Promise<IParticipationRequest>;
  update(id: string, updateDto: UpdateParticipationRequestDto): Promise<IParticipationRequest>;
  remove(id: string): Promise<void>;
  approveRequest(id: string, approverId: string): Promise<IParticipationRequest>;
  rejectRequest(id: string, approverId: string): Promise<IParticipationRequest>;
}