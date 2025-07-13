import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@api/auth/auth.guard';
import { UserChatService, UserProfile } from './user-chat.service';

@Controller('chat-users')
@UseGuards(AuthGuard)
export class UserChatController {
  constructor(private readonly userChatService: UserChatService) {}

  @Get()
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<{
    success: boolean;
    data: UserProfile[];
    total: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    message?: string;
  }> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.userChatService.getAllUsers(pageNum, limitNum, search);
  }
}
