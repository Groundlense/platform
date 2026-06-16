import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateBoringSessionDto } from './dto/create-boring-session.dto';
import { EndBoringSessionDto } from './dto/end-boring-session.dto';

@Injectable()
export class BoringSessionsService {
  constructor(private readonly db: DatabaseService) {}

  async start(boreholeId: string, workerId: string, dto: CreateBoringSessionDto) {
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

  async findByBorehole(boreholeId: string) {
    return this.db.boringSession.findMany({
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
  }
}
