import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Served at the bare root (excluded from the api/v1 prefix in main.ts).
  @Get()
  getRoot() {
    return this.appService.getStatus();
  }

  // Uptime-check endpoint, also unprefixed.
  @Get('health')
  getHealth() {
    return this.appService.getStatus();
  }
}
