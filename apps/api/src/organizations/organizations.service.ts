import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrganizationType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { ProjectAccessService } from '../common/access/project-access.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

// Directory listing never exposes statutory identifiers (GSTIN/PAN) —
// those are only visible on the full profile to the org's own members.
const DIRECTORY_SELECT = {
  id: true,
  name: true,
  type: true,
  city: true,
  state: true,
} as const;

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly access: ProjectAccessService,
    private readonly activityLogsService: ActivityLogsService,
  ) {}

  async findAll(type?: OrganizationType) {
    return this.db.organization.findMany({
      where: type ? { type } : undefined,
      select: DIRECTORY_SELECT,
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(organizationId: string, user: any) {
    const organization =
      await this.db.organization.findUnique({
        where: { id: organizationId },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    // Full profile (GSTIN, PAN, subscription, ...) is restricted to
    // members of the organization or SUPER_ADMIN.
    this.access.assertSameOrganization(
      user,
      organization.id,
    );

    return organization;
  }

  async create(dto: CreateOrganizationDto, user: any) {
    // Normal company creation happens through public /auth/register;
    // only the Groundlense super admin may create arbitrary orgs here.
    if (!this.access.isSuperAdmin(user)) {
      throw new ForbiddenException(
        'Only the platform administrator can create organizations directly',
      );
    }

    const organization =
      await this.db.organization.create({
        data: {
          name: dto.name,
          type: dto.type,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
          city: dto.city,
          state: dto.state,
          country: dto.country,
          gstin: dto.gstin,
          pan: dto.pan,
          registeredAddress: dto.registeredAddress,
          pincode: dto.pincode,
          logoUrl: dto.logoUrl,
          website: dto.website,
        },
      });

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_CREATED',
      'ORGANIZATION',
      organization.id,
      {
        name: organization.name,
        type: organization.type,
      },
    );

    return organization;
  }

  async update(
    organizationId: string,
    dto: UpdateOrganizationDto,
    user: any,
  ) {
    const organization =
      await this.db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    this.access.assertSameOrganization(
      user,
      organizationId,
    );

    const updated = await this.db.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        gstin: dto.gstin,
        pan: dto.pan,
        registeredAddress: dto.registeredAddress,
        pincode: dto.pincode,
        logoUrl: dto.logoUrl,
        website: dto.website,
      },
    });

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_UPDATED',
      'ORGANIZATION',
      organizationId,
      {
        updatedFields: Object.keys(dto),
      },
    );

    return updated;
  }

  // Groundlense-admin action per the RBAC spec ("Verify company KYC").
  // The Organization model carries isVerified/verifiedAt for this.
  async verifyKyc(organizationId: string, user: any) {
    const organization =
      await this.db.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true },
      });

    if (!organization) {
      throw new NotFoundException(
        'Organization not found',
      );
    }

    const updated = await this.db.organization.update({
      where: { id: organizationId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    await this.activityLogsService.log(
      user.id,
      'ORGANIZATION_KYC_VERIFIED',
      'ORGANIZATION',
      organizationId,
      {
        name: organization.name,
      },
    );

    return updated;
  }
}
