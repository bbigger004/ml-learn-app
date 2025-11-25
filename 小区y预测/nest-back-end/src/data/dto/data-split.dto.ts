import { IsArray, IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class DataSplitDto {
  @IsArray()
  data: any[];

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(0.9)
  testRatio?: number;

  @IsOptional()
  @IsString()
  splitMethod?: 'time' | 'random';
}