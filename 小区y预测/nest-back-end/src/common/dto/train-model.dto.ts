import { IsInt, IsString, IsOptional, IsNumber, Min, Max, IsArray } from 'class-validator';

export class TrainModelDto {
  @IsString()
  @IsOptional()
  modelName?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(1000)
  epochs?: number = 100;

  @IsNumber()
  @IsOptional()
  @Min(0.0001)
  @Max(1)
  learningRate?: number = 0.001;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  batchSize?: number = 32;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  lookBack?: number = 12;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  validationSplit?: number = 0.2;

  @IsArray()
  @IsOptional()
  inputFeatures?: string[];

  @IsString()
  @IsOptional()
  targetFeature?: string = 'y';
}