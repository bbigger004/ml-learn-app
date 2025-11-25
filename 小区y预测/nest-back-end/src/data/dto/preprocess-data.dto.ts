import { IsArray, IsOptional, IsObject } from 'class-validator';

export class PreprocessDataDto {
  @IsArray()
  data: any[];

  @IsOptional()
  @IsObject()
  options?: {
    convertNumeric?: boolean;
    handleMissing?: boolean;
    missingValueStrategy?: 'mean' | 'median' | 'mode' | 'drop';
    detectOutliers?: boolean;
    outlierFields?: string[];
    outlierStrategy?: 'clip' | 'remove' | 'replace';
    normalize?: boolean;
    normalizeFields?: string[];
    normalizeMethod?: 'minmax' | 'zscore';
    createTimeFeatures?: boolean;
  };
}