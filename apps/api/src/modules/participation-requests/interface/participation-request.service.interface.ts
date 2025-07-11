import { CreateParticipationRequestDto } from '../dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from '../dto/update-participation-request.dto';
import { IParticipationRequest } from './participation-request.interface';

export interface IParticipationRequestService {
  create(createDto: CreateParticipationRequestDto): Promise<IParticipationRequest>;
  findAll(page: number, limit: number, filter: any): Promise<{
    data: IParticipationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findAllExcludeDeleted(page: number, limit: number, filter: any): Promise<{
    data: IParticipationRequest[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
  findOne(id: string): Promise<IParticipationRequest>;
  update(id: string, updateDto: UpdateParticipationRequestDto): Promise<IParticipationRequest>;
  remove(id: string): Promise<void>;
  approveRequest(id: string, approverId: string): Promise<IParticipationRequest>;
  rejectRequest(id: string, approverId: string): Promise<IParticipationRequest>;
  softDelete(id: string): Promise<IParticipationRequest>;
}