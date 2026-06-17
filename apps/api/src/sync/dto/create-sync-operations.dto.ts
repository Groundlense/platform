import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsObject,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SyncEntityType, OperationType } from '@prisma/client';

export class SyncOperationItemDto {
  @ApiProperty({ description: 'Device ID registry key' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ description: 'Client side operation sequence ID' })
  @IsString()
  @IsNotEmpty()
  operationId: string;

  @ApiProperty({ description: 'Target entity type', enum: SyncEntityType })
  @IsEnum(SyncEntityType)
  @IsNotEmpty()
  entityType: SyncEntityType;

  @ApiProperty({ description: 'UUID of target data entity' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ description: 'Operation type', enum: OperationType })
  @IsEnum(OperationType)
  @IsNotEmpty()
  operationType: OperationType;

  @ApiProperty({ description: 'Changed fields snapshot payload' })
  @IsObject()
  @IsNotEmpty()
  payloadJson: any;

  @ApiPropertyOptional({ description: 'Associated shift boring session ID' })
  @IsString()
  @IsOptional()
  boringSessionId?: string;
}

export class CreateSyncOperationsDto {
  @ApiProperty({
    description: 'Sync queue operations list',
    type: [SyncOperationItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationItemDto)
  operations: SyncOperationItemDto[];
}
