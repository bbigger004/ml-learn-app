import { PredictionService } from './prediction.service';
interface PredictDto {
    modelId: string;
    periods: number;
}
export declare class PredictionController {
    private readonly predictionService;
    constructor(predictionService: PredictionService);
    predict(predictDto: PredictDto): Promise<{
        success: boolean;
        data: {
            predictions: {
                date: string;
                value: number;
                confidence_lower: number;
                confidence_upper: number;
            }[];
            historicalData: {
                date: any;
                value: any;
            }[];
            summary: {
                predictionPeriods: number;
                lastHistoricalDate: string;
                firstPredictionDate: string;
                lastPredictionDate: string;
            };
        };
    }>;
    batchPredict(body: {
        modelId: string;
        inputData: any[];
    }): Promise<{
        success: boolean;
        data: {
            predictions: any[];
            totalCount: number;
        };
    }>;
    calculateConfidenceInterval(body: {
        modelId: string;
        periods: number;
    }): Promise<{
        success: boolean;
        data: {
            modelId: string;
            periods: number;
            confidenceLevel: number;
            intervals: {
                period: number;
                lower: number;
                upper: number;
            }[];
        };
    }>;
}
export {};
