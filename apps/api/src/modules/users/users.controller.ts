import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ForbiddenException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@api/auth/auth.guard';
import { Roles } from '@api/auth/roles.decorator';
import { UserRole } from './schema/user.schema';
import { RolesGuard } from '@api/auth/roles.guard';
import { Express } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from '../upload/upload.service';
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

  @Patch('/update/:id')
  @UseInterceptors(FileInterceptor('avatar'))
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      const avatarURL = await this.uploadService.uploadImage(file);
      console.log(avatarURL);
      updateUserDto.avatarURL = avatarURL.data.savedImage.url;
      return this.usersService.update(id, updateUserDto);
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Post('/remove/:id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
