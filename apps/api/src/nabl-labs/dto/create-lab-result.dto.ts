import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsDateString } from 'class-validator';

export class CreateLabResultDto {
  @ApiProperty({ description: 'ID of the NABL Lab conducting the tests' })
  @IsString()
  @IsNotEmpty()
  nablLabId: string;

  @ApiProperty({ description: 'The geotechnical test type' })
  @IsString()
  @IsNotEmpty()
  testType: string;

  @ApiProperty({ description: 'Raw parameters/values of the test' })
  @IsObject()
  @IsNotEmpty()
  testValues: any;

  @ApiProperty({ description: 'Final processed results metrics' })
  @IsObject()
  @IsNotEmpty()
  resultValues: any;

  @ApiProperty({ description: 'Lab report validation number' })
  @IsString()
  @IsNotEmpty()
  reportNumber: string;

  @ApiProperty({ description: 'URL link to the uploaded PDF certificate report' })
  @IsString()
  @IsNotEmpty()
  reportPdfUrl: string;

  @ApiProperty({ description: 'Date the test was completed' })
  @IsDateString()
  @IsNotEmpty()
  testedOn: string;
}
