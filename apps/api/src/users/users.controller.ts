import { Controller, Get, UseGuards } from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { UsersService } from './users.service';

import { Body, Post } from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';

import { Patch, Param } from '@nestjs/common';

import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPinDto } from './dto/reset-pin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions('USER_VIEW')
  @Get()
  findAll(
    @CurrentUser()
    user: any,
  ) {
    return this.usersService.findAll(user);
  }

  @Permissions('USER_MANAGE')
  @Post()
  createUser(
    @Body()
    dto: CreateUserDto,

    @CurrentUser()
    user: any,
  ) {
    return this.usersService.createUser(dto, user);
  }
  @Permissions('USER_MANAGE')
  @Patch(':id/status')
  updateStatus(
    @Param('id')
    userId: string,

    @Body()
    dto: UpdateUserStatusDto,

    @CurrentUser()
    user: any,
  ) {
    return this.usersService.updateStatus(userId, dto.status, user);
  }
  @Permissions('USER_VIEW')
  @Get(':id')
  findOne(
    @Param('id')
    userId: string,

    @CurrentUser()
    user: any,
  ) {
    return this.usersService.findOne(userId, user);
  }
  @Permissions('USER_MANAGE')
  @Patch(':id/reset-pin')
  resetPin(
    @Param('id')
    userId: string,

    @Body()
    dto: ResetPinDto,

    @CurrentUser()
    user: any,
  ) {
    return this.usersService.resetPin(userId, dto.pin, user);
  }

  @Patch(':id/profile')
  updateProfile(
    @Param('id')
    userId: string,

    @Body()
    dto: UpdateProfileDto,

    @CurrentUser()
    user: any,
  ) {
    return this.usersService.updateProfile(userId, dto, user);
  }
}

