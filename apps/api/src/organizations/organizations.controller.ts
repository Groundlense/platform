import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { ListOrganizationsQueryDto } from './dto/list-organizations-query.dto';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(
    private readonly organizationsService: OrganizationsService,
  ) {}

  // Company directory for pickers — any authenticated user; the
  // response only carries non-sensitive fields (no GSTIN/PAN).
  @Get()
  findAll(@Query() query: ListOrganizationsQueryDto) {
    return this.organizationsService.findAll(query.type);
  }

  // SUPER_ADMIN only (enforced in the service); regular companies
  // self-register through POST /auth/register.
  @Permissions('ORG_MANAGE')
  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.create(dto, user);
  }

  @Get(':id')
  findOne(
    @Param('id') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.findOne(
      organizationId,
      user,
    );
  }

  @Permissions('ORG_MANAGE')
  @Patch(':id')
  update(
    @Param('id') organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.update(
      organizationId,
      dto,
      user,
    );
  }

  // Groundlense-admin action per the RBAC spec ("Verify company KYC").
  // ORG_KYC_VERIFY is assigned to no role — SUPER_ADMIN bypass covers it.
  @Permissions('ORG_KYC_VERIFY')
  @Patch(':id/kyc-verify')
  verifyKyc(
    @Param('id') organizationId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.verifyKyc(
      organizationId,
      user,
    );
  }
}
