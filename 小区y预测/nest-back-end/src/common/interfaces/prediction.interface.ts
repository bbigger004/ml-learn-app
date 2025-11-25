export interface PredictionResult {
  modelId: string;
  predictions: PredictionPoint[];
  metadata?: {
    communityId?: string;
    predictionTime: string;
    confidenceInterval?: boolean;
  };
}

export interface PredictionPoint {
  date: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
  confidence?: number;
}

export interface BatchPredictionResult {
  modelId: string;
  results: {
    communityId?: string;
    predictions: PredictionPoint[];
  }[];
  metadata?: {
    predictionTime: string;
  };
}

export interface ModelComparisonResult {
  models: {
    modelId: string;
    modelName?: string;
    metrics: {
      mae: number;
      mse: number;
      rmse: number;
      r2?: number;
    };
    predictions?: PredictionPoint[];
  }[];
  comparison?: {
    bestModel: string;
    metricRanking: Record<string, string[]>;
  };
  metadata?: {
    comparisonTime: string;
  };
}