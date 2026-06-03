import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectsModule } from './projects/projects.module';
import { BoreholesModule } from './boreholes/boreholes.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.development',
    }),

    DatabaseModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    BoreholesModule,
    MediaModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
