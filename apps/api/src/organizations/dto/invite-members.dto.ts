import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class InviteMemberItemDto {
  @ApiProperty({ description: 'Email address or Employee code of the member' })
  @IsString()
  @IsNotEmpty()
  emailOrCode: string;

  @ApiProperty({ description: 'Role code (e.g. GEOTECH_ENGINEER)' })
  @IsString()
  @IsNotEmpty()
  roleCode: string;
}

export class InviteMembersDto {
  @ApiProperty({
    description: 'List of members to invite',
    type: [InviteMemberItemDto],
  })
  @IsArray()
  @ValidateNested({ generosity: true, each: true } as any)
  @Type(() => InviteMemberItemDto)
  members: InviteMemberItemDto[];
}
