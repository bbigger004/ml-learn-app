export interface CommunityData {
  年月: string;
  小区ID: string;
  y: number;
  小区年限: number;
  小区饱和度: number;
  区域特征1: number;
  区域特征2: number;
  区域特征3: number;
  区域特征4: number;
  区域特征5: number;
  区域特征6: number;
  区域特征7: number;
  区域特征8: number;
}

export interface PreprocessedData {
  features: any[];
  labels: number[];
  featureNames: string[];
  statistics?: {
    mean: Record<string, number>;
    std: Record<string, number>;
    min: Record<string, number>;
    max: Record<string, number>;
  };
}

export interface TimeSeriesData {
  date: string;
  value: number;
  [key: string]: any;
}