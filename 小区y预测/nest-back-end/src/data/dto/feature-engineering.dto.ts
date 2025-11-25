import { IsArray, IsOptional, IsString } from 'class-validator';

export class FeatureEngineeringDto {
  @IsArray()
  data: any[];

  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @IsOptional()
  @IsArray()
  lagSteps?: number[];

  @IsOptional()
  @IsArray()
  windows?: number[];
}