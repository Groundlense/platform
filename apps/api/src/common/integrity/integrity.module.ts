import { Global, Module } from '@nestjs/common';
import { IntegrityService } from './integrity.service';

@Global()
@Module({
  providers: [IntegrityService],
  exports: [IntegrityService],
})
export class IntegrityModule {}
