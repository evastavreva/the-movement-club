import { IsInt, IsISO8601, IsString, Matches, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @Matches(/\S/)
  classType: string;

  @IsString()
  @Matches(/\S/)
  instructor: string;

  @IsISO8601({ strict: true })
  startTime: string;

  @IsInt()
  @Min(1)
  duration: number;
}
