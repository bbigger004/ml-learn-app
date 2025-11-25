export interface DataRow {
  [key: string]: string | number;
}

export interface ModelConfig {
  epochs: number;
  batchSize: number;
  learningRate: number;
  hiddenUnits: number;
}

export interface TrainingMetric {
  epoch: number;
  loss: number;
}

export interface PredictionResult {
  id?: number;
  actual: number;
  predicted: number;
  inputs?: DataRow;
  error?: number;
  errorPercent?: number;
}

export enum TrainingStatus {
  IDLE = '空闲',
  TRAINING = '训练中',
  COMPLETED = '已完成',
}

export interface ColumnMetadata {
  name: string;
  type: 'number' | 'category';
  min?: number;
  max?: number;
  uniqueValues?: string[];
}
