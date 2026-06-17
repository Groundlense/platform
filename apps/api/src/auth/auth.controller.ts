import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Param,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JoinRequestDto } from './dto/join-request.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomBytes } from 'crypto';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.identifier, dto.password);
  }

  // Public company self-registration (org + first admin user).
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('refresh')
  refresh(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: Record<string, unknown>) {
    return user;
  }

  @Post('send-otp')
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('verify-otp')
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Get('verify-gst/:gstin')
  verifyGst(@Param('gstin') gstin: string) {
    return this.authService.verifyGst(gstin);
  }

  @Post('upload-logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          let uploadPath = join(process.cwd(), 'uploads');
          if (!existsSync(uploadPath) && existsSync(join(process.cwd(), 'apps/api/uploads'))) {
            uploadPath = join(process.cwd(), 'apps/api/uploads');
          }
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          cb(
            null,
            `logo-${Date.now()}-${randomBytes(6).toString('hex')}${extname(
              file.originalname,
            )}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Unsupported file type ${file.mimetype}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return {
      success: true,
      filename: file.filename,
      url: `/api/v1/auth/logo/${file.filename}`,
    };
  }

  @Get('logo/:filename')
  getLogo(@Param('filename') filename: string, @Res() res: Response) {
    const absolutePath = join(process.cwd(), 'uploads', filename);
    if (!existsSync(absolutePath)) {
      throw new BadRequestException('Logo file not found');
    }
    res.setHeader('Content-Type', 'image/' + extname(filename).substring(1));
    return res.sendFile(absolutePath);
  }

  @Get('invite/:token')
  getInviteDetails(@Param('token') token: string) {
    return this.authService.getInviteDetails(token);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto);
  }

  @Post('join-request')
  joinRequest(@Body() dto: JoinRequestDto) {
    return this.authService.createJoinRequest(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(
      dto.email,
      dto.code,
      dto.newPassword,
    );
  }
}
