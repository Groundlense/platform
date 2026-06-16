import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ProjectCompanyRole } from '@prisma/client';

export class InviteProjectCompanyDto {
  @ApiProperty({
    description:
      'Organization to link to the project',
    example:
      '3f1d2c40-8a9b-4c1d-9e2f-5a6b7c8d9e0f',
  })
  @IsUUID()
  organizationId: string;

  @ApiProperty({
    description:
      'Role the company plays on this project',
    enum: ProjectCompanyRole,
    example: ProjectCompanyRole.CONTRACTOR,
  })
  @IsEnum(ProjectCompanyRole)
  role: ProjectCompanyRole;
}
