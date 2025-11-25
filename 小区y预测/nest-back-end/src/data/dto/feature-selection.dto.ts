import { IsArray, IsString } from 'class-validator';

export class FeatureSelectionDto {
  @IsArray()
  data: any[];

  @IsArray()
  @IsString({ each: true })
  features: string[];
}