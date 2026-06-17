import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSoilDescriptionDto } from './dto/create-soil-description.dto';

@Injectable()
export class SoilDescriptionsService {
  constructor(private readonly db: DatabaseService) {}

  async upsert(
    intervalId: string,
    userId: string,
    dto: CreateSoilDescriptionDto,
  ) {
    const interval = await this.db.boreholeInterval.findUnique({
      where: { id: intervalId },
    });
    if (!interval) {
      throw new NotFoundException('Borehole interval not found');
    }

    return this.db.soilDescription.upsert({
      where: { sptRecordId: intervalId },
      update: {
        soilType: dto.soilType,
        uscsCode: dto.uscsCode || null,
        color: dto.color || null,
        consistency: dto.consistency || null,
        description: dto.description,
        remarks: dto.remarks || null,
        enteredByUserId: userId,
      },
      create: {
        sptRecordId: intervalId,
        soilType: dto.soilType,
        uscsCode: dto.uscsCode || null,
        color: dto.color || null,
        consistency: dto.consistency || null,
        description: dto.description,
        remarks: dto.remarks || null,
        enteredByUserId: userId,
      },
    });
  }

  async findByInterval(intervalId: string) {
    const description = await this.db.soilDescription.findUnique({
      where: { sptRecordId: intervalId },
      include: {
        enteredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!description) {
      throw new NotFoundException(
        'Soil description not found for this interval',
      );
    }
    return description;
  }
}
