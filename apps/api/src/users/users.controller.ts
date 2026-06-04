import {
  Controller,
  Get,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { UsersService } from './users.service';

import {
  Body,
  Post,
} from '@nestjs/common';

import { CreateUserDto } from './dto/create-user.dto';

import {
  Patch,
  Param,
} from '@nestjs/common';

import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ResetPinDto } from './dto/reset-pin.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
createUser(
  @Body()
  dto: CreateUserDto,
) {
  return this.usersService.createUser(
    dto,
  );
}
@Patch(':id/status')
updateStatus(
  @Param('id')
  userId: string,

  @Body()
  dto: UpdateUserStatusDto,
) {
  return this.usersService.updateStatus(
    userId,
    dto.status,
  );
}
@Get(':id')
findOne(
  @Param('id')
  userId: string,
) {
  return this.usersService.findOne(
    userId,
  );
}
@Patch(':id/reset-pin')
resetPin(
  @Param('id')
  userId: string,

  @Body()
  dto: ResetPinDto,
) {
  return this.usersService.resetPin(
    userId,
    dto.pin,
  );
}
}