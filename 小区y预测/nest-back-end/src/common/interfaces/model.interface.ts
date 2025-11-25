export interface ModelInfo {
  id: string;
  name: string;
  type: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    epochs: number;
    learningRate: number;
    batchSize: number;
    lookBack: number;
    inputFeatures: string[];
    targetFeature: string;
    [key: string]: any;
  };
}

export interface ModelMetrics {
  loss: number;
  val_loss: number;
  mae: number;
  val_mae?: number;
  mse: number;
  val_mse?: number;
  rmse: number;
  val_rmse?: number;
  r2?: number;
  val_r2?: number;
}

export interface TrainingHistory {
  loss: number[];
  val_loss: number[];
  mae: number[];
  val_mae?: number[];
  mse: number[];
  val_mse?: number[];
  rmse: number[];
  val_rmse?: number[];
  r2?: number[];
  val_r2?: number[];
}

export interface ModelConfiguration {
  modelName?: string;
  epochs?: number;
  learningRate?: number;
  batchSize?: number;
  lookBack?: number;
  validationSplit?: number;
  inputFeatures?: string[];
  targetFeature?: string;
}