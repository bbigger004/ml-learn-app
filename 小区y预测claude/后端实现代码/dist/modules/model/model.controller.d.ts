import { ModelService } from './model.service';
interface TrainModelDto {
    selectedFeatures: string[];
    targetColumn: string;
    testSize?: number;
    modelParams?: {
        n_estimators?: number;
        max_depth?: number;
        learning_rate?: number;
    };
}
export declare class ModelController {
    private readonly modelService;
    constructor(modelService: ModelService);
    trainModel(trainModelDto: TrainModelDto): Promise<{
        success: boolean;
        message: string;
        data: {
            modelId: string;
            trainingTime: string;
            evaluation: {
                mse: number;
                rmse: number;
                mae: number;
                r2: number;
            };
            featureImportance: {
                feature: string;
                importance: number;
            }[];
            dataSummary: {
                totalSamples: number;
                trainingSamples: number;
                testSamples: number;
                featureCount: number;
            };
        };
    }>;
    getModelEvaluation(modelId: string): Promise<{
        success: boolean;
        data: {
            modelId: string;
            evaluation: {
                mse: number;
                rmse: number;
                mae: number;
                r2: number;
            };
            featureImportance: {
                feature: string;
                importance: number;
            }[];
            trainingParams: any;
            createdAt: Date;
        };
    }>;
    getModelList(): Promise<{
        success: boolean;
        data: {
            models: {
                modelId: string;
                trainingTime: number;
                evaluation: {
                    mse: number;
                    rmse: number;
                    mae: number;
                    r2: number;
                };
                createdAt: Date;
            }[];
            totalCount: number;
        };
    }>;
    retrainModel(modelId: string, trainModelDto: TrainModelDto): Promise<{
        success: boolean;
        message: string;
        data: {
            modelId: string;
            trainingTime: string;
            evaluation: {
                mse: number;
                rmse: number;
                mae: number;
                r2: number;
            };
            featureImportance: {
                feature: string;
                importance: number;
            }[];
            dataSummary: {
                totalSamples: number;
                trainingSamples: number;
                testSamples: number;
                featureCount: number;
            };
        };
    }>;
}
export {};
