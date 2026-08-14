import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseModule } from '../database/database.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    DatabaseModule,
    ActivityLogsModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),

        // 7 days: field workers keep the app logged in across multi-day
        // offline stretches, and a longer window means far fewer refresh
        // round-trips on flaky connections. The mobile app silently
        // refreshes via POST /auth/refresh on 401 (with a server-side
        // rotation grace window), and the refresh token lasts 30 days.
        // Web session cookies (apps/web/src/lib/session.ts) match at 7d.
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
