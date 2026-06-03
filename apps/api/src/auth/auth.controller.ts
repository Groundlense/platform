import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

import { Get } from '@nestjs/common';

import { UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { CurrentUser } from './decorators/current-user.decorator';

import { RefreshTokenDto } from './dto/refresh-token.dto';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(
      dto.identifier,
      dto.password,
    );
  }

  @Post('refresh')
  refresh(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(
      dto.refreshToken,
    );
  }

  @Post('logout')
logout(
  @Body()
  dto: RefreshTokenDto,
) {
  return this.authService.logout(
    dto.refreshToken,
  );
}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(
    @CurrentUser() user: any,
  ) {
    return user;
  }
}