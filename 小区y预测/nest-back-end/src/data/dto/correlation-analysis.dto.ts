import { IsArray, IsString } from 'class-validator';

export class CorrelationAnalysisDto {
  @IsArray()
  data: any[];

  @IsString()
  targetField: string;
}