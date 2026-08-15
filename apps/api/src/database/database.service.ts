import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/** Wait schedule between connection attempts — covers a Neon cold start
 *  (serverless Postgres resumes in a few seconds, occasionally longer). */
const RETRY_DELAYS_MS = [2_000, 4_000, 8_000, 15_000, 30_000];

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  async onModuleInit() {
    // A suspended/cold Neon endpoint fails the first connect with P1001.
    // Retry with backoff instead of crashing the whole API at boot.
    for (let attempt = 0; ; attempt++) {
      try {
        await this.$connect();
        if (attempt > 0) {
          this.logger.log(`Database connected after ${attempt + 1} attempts`);
        }
        return;
      } catch (err) {
        if (attempt >= RETRY_DELAYS_MS.length) {
          this.logger.error(
            `Database unreachable after ${attempt + 1} attempts — giving up`,
          );
          throw err;
        }
        const delay = RETRY_DELAYS_MS[attempt];
        this.logger.warn(
          `Database connect failed (attempt ${attempt + 1}/${RETRY_DELAYS_MS.length + 1}): ${
            (err as Error).message?.split('\n')[0]
          } — retrying in ${delay / 1000}s`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
