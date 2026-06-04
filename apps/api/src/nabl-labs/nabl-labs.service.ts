import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';

@Injectable()
export class NablLabsService {
  constructor(private readonly db: DatabaseService) {}

  async registerLab(dto: CreateNablLabDto) {
    const org = await this.db.organization.findUnique({
      where: { id: dto.companyId },
    });
    if (!org) {
      throw new NotFoundException('Company organization not found');
    }

    return this.db.nablLab.upsert({
      where: { companyId: dto.companyId },
      update: {
        nablCertNumber: dto.nablCertNumber,
        labName: dto.labName,
        accreditedTests: dto.accreditedTests,
        certValidFrom: new Date(dto.certValidFrom),
        certValidUntil: new Date(dto.certValidUntil),
        verificationDocUrl: dto.verificationDocUrl || null,
        isVerified: true,
      },
      create: {
        companyId: dto.companyId,
        nablCertNumber: dto.nablCertNumber,
        labName: dto.labName,
        accreditedTests: dto.accreditedTests,
        certValidFrom: new Date(dto.certValidFrom),
        certValidUntil: new Date(dto.certValidUntil),
        verificationDocUrl: dto.verificationDocUrl || null,
        isVerified: true,
      },
    });
  }

  async findAllLabs() {
    return this.db.nablLab.findMany({
      include: {
        organization: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async submitResult(sampleId: string, dto: CreateLabResultDto) {
    const sample = await this.db.sample.findUnique({
      where: { id: sampleId },
    });
    if (!sample) {
      throw new NotFoundException('Soil sample not found');
    }

    const lab = await this.db.nablLab.findUnique({
      where: { id: dto.nablLabId },
    });
    if (!lab) {
      throw new NotFoundException('NABL Lab not registered');
    }

    // Submit lab result and update sample status
    return this.db.$transaction(async (tx) => {
      const result = await tx.labResult.upsert({
        where: { sampleId },
        update: {
          nablLabId: dto.nablLabId,
          testType: dto.testType,
          testValues: dto.testValues,
          resultValues: dto.resultValues,
          reportNumber: dto.reportNumber,
          reportPdfUrl: dto.reportPdfUrl,
          testedOn: new Date(dto.testedOn),
        },
        create: {
          sampleId,
          nablLabId: dto.nablLabId,
          testType: dto.testType,
          testValues: dto.testValues,
          resultValues: dto.resultValues,
          reportNumber: dto.reportNumber,
          reportPdfUrl: dto.reportPdfUrl,
          testedOn: new Date(dto.testedOn),
        },
      });

      await tx.sample.update({
        where: { id: sampleId },
        data: {
          status: 'TESTED',
        },
      });

      return result;
    });
  }

  async getResult(sampleId: string) {
    const result = await this.db.labResult.findUnique({
      where: { sampleId },
      include: {
        nablLab: true,
        sample: true,
      },
    });
    if (!result) {
      throw new NotFoundException('No lab results found for this sample');
    }
    return result;
  }
}
