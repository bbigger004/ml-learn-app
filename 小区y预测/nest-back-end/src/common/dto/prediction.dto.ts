import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, Min } from 'class-validator';

export class PredictionDto {
  @IsString()
  modelId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  months?: number = 6;

  @IsBoolean()
  @IsOptional()
  calculateConfidence?: boolean = false;

  @IsArray()
  @IsOptional()
  inputData?: any[];

  @IsString()
  @IsOptional()
  communityId?: string;
}

export class BatchPredictionDto {
  @IsString()
  modelId: string;

  @IsArray()
  @IsOptional()
  inputData: any[];

  @IsNumber()
  @IsOptional()
  @Min(1)
  months?: number = 6;
}

export class CompareModelsDto {
  @IsArray()
  modelIds: string[];

  @IsArray()
  @IsOptional()
  testData?: any[];
}