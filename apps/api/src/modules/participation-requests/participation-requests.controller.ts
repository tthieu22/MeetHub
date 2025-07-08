import { Controller, Get, Post, Body, Param, Put, Delete, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { ParticipationRequestsService } from './participation-requests.service';
import { CreateParticipationRequestDto } from './dto/create-participation-request.dto';
import { UpdateParticipationRequestDto } from './dto/update-participation-request.dto';
import { AuthGuard } from '@api/auth/auth.guard';
import { RolesGuard } from '@api/auth/roles.guard';
import { Roles } from '@api/auth/roles.decorator';
import { UserRole } from '@api/modules/users/schema/user.schema';

@Controller('participation-requests')
@UseGuards(AuthGuard)
export class ParticipationRequestsController {
  constructor(private readonly service: ParticipationRequestsService) {}

  @Post("add-participation-request")
  async create(@Body() createDto: CreateParticipationRequestDto) {
    const data = await this.service.create(createDto);
    return { success: true, data };
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('filter') filter: string = '{}'
  ) {
    const parsedFilter = JSON.parse(filter);
    const result = await this.service.findAll(page, limit, parsedFilter);
    return {
      success: true,
      ...result,
      filter: parsedFilter
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() updateDto: UpdateParticipationRequestDto) {
    const data = await this.service.update(id, updateDto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
    return { success: true };
  }

  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @Body('approverId') approverId: string
  ) {
    const data = await this.service.approveRequest(id, approverId);
    return { success: true, data };
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body('approverId') approverId: string
  ) {
    const data = await this.service.rejectRequest(id, approverId);
    return { success: true, data };
  }
}