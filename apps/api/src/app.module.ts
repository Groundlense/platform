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
import { SitesModule } from './sites/sites.module';
import { TeamsModule } from './teams/teams.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';

// New Phase 1 Modules
import { BoringSessionsModule } from './boring-sessions/boring-sessions.module';
import { SoilDescriptionsModule } from './soil-descriptions/soil-descriptions.module';
import { NablLabsModule } from './nabl-labs/nabl-labs.module';
import { PaymentsModule } from './payments/payments.module';
import { SyncModule } from './sync/sync.module';

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
    SitesModule,
    TeamsModule,
    ActivityLogsModule,
    BoringSessionsModule,
    SoilDescriptionsModule,
    NablLabsModule,
    PaymentsModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
