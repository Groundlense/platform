import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';

@Injectable()
export class BoringSessionsService {
  constructor(private readonly db: DatabaseService) {}

  async start(
    boreholeId: string,
    workerId: string,
    dto: CreateBoringSessionDto,
  ) {
    // Verify borehole exists
    const borehole = await this.db.borehole.findUnique({
      where: { id: boreholeId },
    });
    if (!borehole) {
      throw new NotFoundException('Borehole not found');
    }

    return this.db.boringSession.create({
      data: {
        boreholeId,
        workerId,
        startDepth: dto.startDepth,
        endDepth: dto.startDepth, // Initial endDepth is same as startDepth
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
    });
  }

  async end(sessionId: string, dto: EndBoringSessionDto) {
    const session = await this.db.boringSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      throw new NotFoundException('Boring session not found');
    }

    return this.db.boringSession.update({
      where: { id: sessionId },
      data: {
        endDepth: dto.endDepth,
        status: dto.status,
        terminationReason: dto.terminationReason || null,
        endedAt: new Date(),
      },
    });
  }

  /**
   * Session history, newest first.
   *
   * endDepth is seeded with startDepth and only rewritten when the worker
   * terminates, so the newest session reports ground shallower than its own
   * intervals prove. The resume screen reads exactly this field, so a boring
   * drilled to 34.5 m would send the worker back to re-drill already-tested
   * ground. The newest session is therefore reported at no less than the
   * deepest interval recorded on the borehole.
   *
   * Computed on read rather than stored, so boreholes whose data synced
   * before this existed are corrected too — an interval already on the server
   * never syncs again, so nothing would come along to repair a stored value.
   *
   * Older sessions keep their recorded depths: those are the shift/handover
   * audit trail, and each one's endDepth is the real depth at its handover.
   */
  async findByBorehole(boreholeId: string) {
    const sessions = await this.db.boringSession.findMany({
      where: { boreholeId },
      include: {
        worker: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    if (sessions.length === 0) {
      return sessions;
    }

    const deepestInterval = await this.db.boreholeInterval.aggregate({
      where: { boreholeId },
      _max: { toDepth: true },
    });

    const proven = Number(deepestInterval._max.toDepth);
    const [newest, ...earlier] = sessions;
    const reported = Number(newest.endDepth);

    if (!Number.isFinite(proven) || (Number.isFinite(reported) && reported >= proven)) {
      return sessions;
    }

    // Plain number so the installed app's Number(endDepth) reads 34.5, not a
    // Decimal object the JSON layer might stringify inconsistently.
    return [{ ...newest, endDepth: proven }, ...earlier];
  }
}
