import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ParticipationRequestsService } from './participation-requests.service';
import { CreateParticipationRequestDto } from './dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from './dto/update-participation-request.dto';


@Controller('participation-requests')
export class ParticipationRequestsController {
  constructor(private readonly participationRequestsService: ParticipationRequestsService) {}

  @Post()
  async create(@Body() createDto: CreateParticipationRequestDto) {
    return this.participationRequestsService.create(createDto);
  }

  @Get()
  async findAll() {
    return this.participationRequestsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.participationRequestsService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: UpdateParticipationRequestDto) {
    return this.participationRequestsService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.participationRequestsService.remove(id);
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Body('approverId') approverId: string) {
    return this.participationRequestsService.approveRequest(id, approverId);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string, @Body('approverId') approverId: string) {
    return this.participationRequestsService.rejectRequest(id, approverId);
  }
}