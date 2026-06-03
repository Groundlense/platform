import { IsString } from 'class-validator';

export class AddProjectMemberDto {
  @IsString()
  userId: string;
}