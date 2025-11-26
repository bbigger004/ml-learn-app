import { ModelService } from '../model/model.service';
import { DataService } from '../data/data.service';
export declare class PredictionService {
    private readonly modelService;
    private readonly dataService;
    constructor(modelService: ModelService, dataService: DataService);
    predict(modelId: string, periods?: number): Promise<{
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
    batchPredict(modelId: string, inputData: any[]): Promise<{
        success: boolean;
        data: {
            predictions: any[];
            totalCount: number;
        };
    }>;
    calculateConfidenceInterval(modelId: string, periods: number): Promise<{
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
    private getLastDate;
    private generateFutureDates;
    private generatePredictions;
    private predictLinearRegression;
    private calculateConfidenceIntervals;
    private prepareHistoricalChartData;
}
