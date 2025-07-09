import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { CreateRoomDto, UpdateRoomDto, AddMemberDto } from './dto';
import { AuthGuard } from '../../auth/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('rooms')
@UseGuards(AuthGuard)
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

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

  // 14. Xóa phòng chat (admin)
  @Delete(':id')
  async deleteRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.deleteRoom(id, userId);
  }

  // 15. Tham gia phòng chat (group)
  @Post(':id/join')
  async joinRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.joinRoom(id, userId);
  }

  // 16. Rời khỏi phòng chat
  @Post(':id/leave')
  async leaveRoom(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.leaveRoom(id, userId);
  }

  // 17. Thêm user vào group chat
  @Post(':id/add-member')
  async addMember(@Param('id') id: string, @Body() addMemberDto: AddMemberDto, @CurrentUser() userId: string) {
    return await this.roomService.addMember(id, addMemberDto.userId, userId);
  }

  // 18. Xoá người ra khỏi phòng
  @Delete(':id/remove-member/:uid')
  async removeMember(@Param('id') id: string, @Param('uid') uid: string, @CurrentUser() userId: string) {
    return await this.roomService.removeMember(id, uid, userId);
  }

  // 19. Lấy danh sách user trong phòng
  @Get(':id/members')
  async getRoomMembers(@Param('id') id: string, @CurrentUser() userId: string) {
    return await this.roomService.getRoomMembers(id, userId);
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
