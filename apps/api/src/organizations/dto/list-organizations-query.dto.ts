import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { OrganizationType } from '@prisma/client';

export class ListOrganizationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter the directory by company type',
    enum: OrganizationType,
  })
  @IsOptional()
  @IsEnum(OrganizationType)
  type?: OrganizationType;
}
