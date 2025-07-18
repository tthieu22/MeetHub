import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, Query } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto, UpdateRoomDto, AddMemberDto } from './dto';
import { CurrentUser } from '@api/common/decorators/current-user.decorator';
import { AuthGuard } from '@api/auth/auth.guard';
import { ConversationMemberDocument } from './schema/conversation-member.schema';
import { PaginationQueryDto } from '@api/modules/users/dto/pagination-query.dto';

@Controller('chat/rooms')
@UseGuards(AuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async getSidebarRooms(@Req() req: Request & { user: { sub: string } }) {
    const userId = req.user.sub;
    return this.roomService.getRoomSidebarInfo(userId);
  }

  // 10. Tạo phòng mới (1-1 hoặc group)
  @Post()
  async createRoom(@Body() createRoomDto: CreateRoomDto, @CurrentUser() userId: string) {
    return await this.roomService.createRoom(createRoomDto, userId);
  }

  // 11. Danh sách phòng của user
  @Get()
  async getRooms(@CurrentUser() userId: string) {
    return await this.roomService.getRooms(userId);
  }

  // Lấy tất cả user với phân trang
  @Get('all-users')
  async getAllUsers(@Query() query: PaginationQueryDto & { conversationId?: string }) {
    return await this.roomService.getAllUsersWithPagination(query);
  }

  // 12. Thông tin chi tiết 1 phòng
  @Get(':id')
  async getRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.getRoom(id, userId);
  }

  // 13. Cập nhật tên, mô tả phòng
  @Put(':id')
  async updateRoom(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto, @CurrentUser() userId: string) {
    return await this.roomService.updateRoom(id, updateRoomDto, userId);
  }

  // Lấy vai trò của user trong phòng chat
  @Get(':id/role')
  async getUserRoleInRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    const role = await this.roomService.getUserRoleInRoom(id, userId);
    return { success: true, data: { role } };
  }

  // Xoá phòng chat (admin)
  @Delete(':id')
  async deleteRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.deleteRoom(id, userId);
  }

  // Rời khỏi phòng chat (user)
  @Post(':id/leave')
  async leaveRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.leaveRoom(id, userId);
  }

  // 17. Thêm user vào group chat
  @Post(':id/add-member')
  async addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto) {
    return await this.roomService.addMember(id, addMemberDto.userId);
  }

  // Thêm nhiều user vào group chat
  @Post(':id/add-members')
  async addMembers(@Param('id') id: string, @Body('userIds') userIds: string[]) {
    return await this.roomService.addMembers(id, userIds);
  }

  // 18. Xoá người ra khỏi phòng
  @Delete(':id/remove-member/:uid')
  async removeMember(@Param('id') id: string, @Param('uid') uid: string, @CurrentUser() userId: string) {
    return await this.roomService.removeMember(id, uid, userId);
  }

  // Xoá nhiều user khỏi group chat
  @Post(':id/remove-members')
  async removeMembers(@Param('id') id: string, @Body('userIds') userIds: string[], @CurrentUser() userId: string) {
    return await this.roomService.removeMembers(id, userIds, userId);
  }

  // 19. Lấy danh sách user trong phòng
  @Get(':id/members')
  async getRoomMembers(@Param('id') id: string, @CurrentUser() userId: string) {
    try {
      const members: ConversationMemberDocument[] = await this.roomService.getRoomMembers(id, userId);
      return { success: true, data: members };
    } catch {
      return { success: false, data: [] };
    }
  }

  // 22. Đánh dấu toàn bộ tin nhắn trong phòng là đã đọc
  @Put(':id/read-all')
  async markAllAsRead(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.markAllAsRead(id, userId);
  }

  // 23. Lấy số lượng tin nhắn chưa đọc trong phòng
  @Get(':id/unread-count')
  async getUnreadCount(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.getUnreadCount(id, userId);
  }
}
