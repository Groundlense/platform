import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateNablLabDto } from './dto/create-nabl-lab.dto';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { DispatchSampleDto } from './dto/dispatch-sample.dto';

@Injectable()
export class NablLabsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async registerLab(dto: CreateNablLabDto) {
    const org = await this.db.organization.findUnique({
      where: { id: dto.companyId },
    });
    if (!org) {
      throw new NotFoundException('Company organization not found');
    }

    // Labs are NOT self-verified: per the RBAC spec, only Groundlense
    // admins approve NABL labs (see approveLab).
    return this.db.nablLab.upsert({
      where: { companyId: dto.companyId },
      update: {
        nablCertNumber: dto.nablCertNumber,
        labName: dto.labName,
        accreditedTests: dto.accreditedTests,
        certValidFrom: new Date(dto.certValidFrom),
        certValidUntil: new Date(dto.certValidUntil),
        verificationDocUrl: dto.verificationDocUrl || null,
        isVerified: false,
      },
      create: {
        companyId: dto.companyId,
        nablCertNumber: dto.nablCertNumber,
        labName: dto.labName,
        accreditedTests: dto.accreditedTests,
        certValidFrom: new Date(dto.certValidFrom),
        certValidUntil: new Date(dto.certValidUntil),
        verificationDocUrl: dto.verificationDocUrl || null,
        isVerified: false,
      },
    });
  }

  async approveLab(labId: string) {
    const lab = await this.db.nablLab.findUnique({
      where: { id: labId },
    });
    if (!lab) {
      throw new NotFoundException('NABL Lab not registered');
    }

    return this.db.nablLab.update({
      where: { id: labId },
      data: { isVerified: true },
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

  async dispatchSample(sampleId: string, dto: DispatchSampleDto, user: any) {
    const sample = await this.db.sample.findUnique({
      where: { id: sampleId },
    });
    if (!sample) {
      throw new NotFoundException('Soil sample not found');
    }

    // Caller must have access to the sample's project via the
    // interval → borehole → project chain.
    await this.access.assertIntervalAccess(user, sample.intervalId);

    const lab = await this.db.nablLab.findUnique({
      where: { id: dto.assignedLabId },
    });
    if (!lab) {
      throw new NotFoundException('NABL Lab not registered');
    }

    // Spec: samples may only be dispatched to Groundlense-approved labs.
    if (!lab.isVerified) {
      throw new BadRequestException(
        'NABL lab is not yet approved by Groundlense',
      );
    }

    const updated = await this.db.sample.update({
      where: { id: sampleId },
      data: {
        assignedLabId: lab.id,
        dispatchedToLabId: lab.id,
        dispatchDate: dto.dispatchDate
          ? new Date(dto.dispatchDate)
          : new Date(),
        status: 'DISPATCHED',
      },
    });

    await this.activityLogsService.log(
      user.id,
      'SAMPLE_DISPATCHED',
      'SAMPLE',
      sampleId,
      {
        assignedLabId: lab.id,
        labName: lab.labName,
      },
    );

    return updated;
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
