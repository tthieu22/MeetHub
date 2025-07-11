import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@api/auth/auth.guard';
import { Roles } from '@api/auth/roles.decorator';
import { UserRole } from './schema/user.schema';
import { RolesGuard } from '@api/auth/roles.guard';
import { Express, Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
import { UpdateMeDto } from './dto/update-user-me.dto';
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private uploadService: UploadService,
  ) {}

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('/find-all')
  findAll() {
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch('/update/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      const avatarURL = await this.uploadService.uploadImage(file);
      updateUserDto.avatarURL = avatarURL.data.savedImage.url;
      return this.usersService.update(id, updateUserDto);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post('/remove/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @UseGuards(AuthGuard)
  @Get('/me')
  async getMe(@Req() req: Request) {
    console.log('hello');
    console.log(req.user);
    if (!req.user) return { success: false, messege: 'vui lòng đăng nhập' };
    return this.usersService.findById(req.user._id);
  }

  @UseGuards(AuthGuard)
  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateMe(@Req() req: Request, @Body() dto: UpdateMeDto, @UploadedFile() file: Express.Multer.File) {
    if (!req.user) return { success: false, messege: 'vui lòng đăng nhập' };

    if (file) {
      const avatarURL = await this.uploadService.uploadImage(file);
      dto.avatarURL = avatarURL.data.savedImage.url;
      return this.usersService.updateMe(req.user._id, dto);
    }
    return this.usersService.updateMe(req.user._id, dto);
  }
}
