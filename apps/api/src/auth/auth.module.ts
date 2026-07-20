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

        // No silent-refresh flow is wired up yet (POST /auth/refresh exists
        // but nothing calls it) — the web session cookie lives 24h (see
        // apps/web/src/lib/session.ts), so the JWT must last at least that
        // long or users get hard-booted mid-session once the old 15-minute
        // token goes stale. Chosen deliberately over building refresh
        // plumbing; revisit if a proper silent-refresh flow gets added.
        signOptions: {
          expiresIn: '24h',
        },
      }),
    }),
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
