import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
} from 'class-validator';

export class AssignProjectRoleDto {
  @ApiProperty({
    description:
      'User receiving the project-level role',
    example:
      '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description:
      'Role code (roles.code) to assign at project level, e.g. GEOTECH_ENGINEER',
    example: 'GEOTECH_ENGINEER',
  })
  @IsString()
  @IsNotEmpty()
  projectRole: string;
}
