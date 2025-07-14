import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@api/auth/auth.guard';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto, RespondToInvitationDto } from './dto/create-invitation.dto';

@Controller('chat-invitations')
@UseGuards(AuthGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * Gửi lời mời chat
   * POST /api/chat-invitations
   */
  @Post()
  async createInvitation(@Request() req: { user: { _id: string } }, @Body() createInvitationDto: CreateInvitationDto) {
    return this.invitationService.createInvitation(req.user._id, createInvitationDto);
  }

  /**
   * Lấy danh sách lời mời đã nhận
   * GET /api/chat-invitations/received
   */
  @Get('received')
  async getReceivedInvitations(@Request() req: { user: { _id: string } }) {
    return this.invitationService.getReceivedInvitations(req.user._id);
  }

  /**
   * Lấy danh sách lời mời đã gửi
   * GET /api/chat-invitations/sent
   */
  @Get('sent')
  async getSentInvitations(@Request() req: { user: { _id: string } }) {
    return this.invitationService.getSentInvitations(req.user._id);
  }

  /**
   * Xử lý lời mời (accept/decline)
   * PUT /api/chat-invitations/:invitationId/respond
   */
  @Put(':invitationId/respond')
  async respondToInvitation(@Request() req: { user: { _id: string } }, @Param('invitationId') invitationId: string, @Body() respondDto: RespondToInvitationDto) {
    return this.invitationService.respondToInvitation(req.user._id, invitationId, respondDto);
  }

  /**
   * Hủy lời mời
   * DELETE /api/chat-invitations/:invitationId
   */
  @Delete(':invitationId')
  async cancelInvitation(@Request() req: { user: { _id: string } }, @Param('invitationId') invitationId: string) {
    return this.invitationService.cancelInvitation(req.user._id, invitationId);
  }
}
