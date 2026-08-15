import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'ok',
      service: 'groundlense-api',
      docs: '/api/docs',
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }
}
