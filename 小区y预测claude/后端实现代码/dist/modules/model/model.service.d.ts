import { DataService } from '../data/data.service';
interface ModelInfo {
    modelId: string;
    trainingTime: number;
    evaluation: {
        mse: number;
        rmse: number;
        mae: number;
        r2: number;
    };
    featureImportance: Array<{
        feature: string;
        importance: number;
    }>;
    trainingParams: any;
    createdAt: Date;
    modelData: {
        coefficients: number[];
        intercept: number;
        featureNames: string[];
    };
}
export declare class ModelService {
    private readonly dataService;
    private models;
    constructor(dataService: DataService);
    trainModel(trainModelDto: {
        selectedFeatures: string[];
        targetColumn: string;
        testSize?: number;
        modelParams?: any;
    }): Promise<{
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
    retrainModel(modelId: string, trainModelDto: any): Promise<{
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
    getModel(modelId: string): ModelInfo | undefined;
    private prepareTrainingData;
    private trainLinearRegression;
    private predictLinearRegression;
    private evaluateModel;
    private calculateFeatureImportance;
    private transpose;
    private multiplyMatrices;
    private multiplyMatrixVector;
    private solveLinearSystem;
    private calculateMSE;
    private calculateMAE;
    private calculateR2;
}
export {};
