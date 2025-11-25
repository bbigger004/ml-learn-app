"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionService = void 0;
const common_1 = require("@nestjs/common");
const model_service_1 = require("../model/model.service");
const data_service_1 = require("../data/data.service");
let PredictionService = class PredictionService {
    constructor(modelService, dataService) {
        this.modelService = modelService;
        this.dataService = dataService;
    }
    async predict(modelId, periods = 6) {
        try {
            const modelInfo = this.modelService.getModel(modelId);
            if (!modelInfo) {
                throw new common_1.NotFoundException('模型不存在');
            }
            const historicalData = this.dataService.getCurrentData();
            if (!historicalData || historicalData.length === 0) {
                throw new common_1.BadRequestException('没有可用的历史数据');
            }
            const lastDate = this.getLastDate(historicalData);
            const futureDates = this.generateFutureDates(lastDate, periods);
            const predictions = this.generatePredictions(modelInfo, historicalData, periods);
            const confidenceIntervals = this.calculateConfidenceIntervals(predictions);
            const historicalChartData = this.prepareHistoricalChartData(historicalData);
            return {
                success: true,
                data: {
                    predictions: futureDates.map((date, index) => ({
                        date,
                        value: predictions[index],
                        confidence_lower: confidenceIntervals[index].lower,
                        confidence_upper: confidenceIntervals[index].upper,
                    })),
                    historicalData: historicalChartData,
                    summary: {
                        predictionPeriods: periods,
                        lastHistoricalDate: lastDate,
                        firstPredictionDate: futureDates[0],
                        lastPredictionDate: futureDates[futureDates.length - 1],
                    },
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`预测失败: ${error.message}`);
        }
    }
    async batchPredict(modelId, inputData) {
        const modelInfo = this.modelService.getModel(modelId);
        if (!modelInfo) {
            throw new common_1.NotFoundException('模型不存在');
        }
        try {
            const predictions = [];
            for (const input of inputData) {
                const inputValues = modelInfo.modelData.featureNames.map(feature => Number(input[feature]) || 0);
                const prediction = this.predictLinearRegression([inputValues], modelInfo.modelData.coefficients, modelInfo.modelData.intercept)[0];
                predictions.push({
                    input,
                    prediction: prediction,
                });
            }
            return {
                success: true,
                data: {
                    predictions,
                    totalCount: predictions.length,
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`批量预测失败: ${error.message}`);
        }
    }
    async calculateConfidenceInterval(modelId, periods) {
        return {
            success: true,
            data: {
                modelId,
                periods,
                confidenceLevel: 0.95,
                intervals: Array.from({ length: periods }, (_, i) => ({
                    period: i + 1,
                    lower: Math.random() * 2 + 28,
                    upper: Math.random() * 2 + 32,
                })),
            },
        };
    }
    getLastDate(data) {
        const dates = data.map(row => row['年月']).filter(date => date);
        const lastDate = dates[dates.length - 1] || '202412';
        return String(lastDate);
    }
    generateFutureDates(lastDate, periods) {
        const dates = [];
        let year = parseInt(lastDate.substring(0, 4));
        let month = parseInt(lastDate.substring(4, 6));
        for (let i = 0; i < periods; i++) {
            month++;
            if (month > 12) {
                month = 1;
                year++;
            }
            dates.push(`${year}${month.toString().padStart(2, '0')}`);
        }
        return dates;
    }
    generatePredictions(modelInfo, historicalData, periods) {
        const predictions = [];
        const recentData = historicalData.slice(-10);
        for (let i = 0; i < periods; i++) {
            const featureValues = modelInfo.modelData.featureNames.map(feature => {
                const values = recentData.map(row => Number(row[feature]) || 0);
                return values.reduce((a, b) => a + b, 0) / values.length;
            });
            const prediction = this.predictLinearRegression([featureValues], modelInfo.modelData.coefficients, modelInfo.modelData.intercept)[0];
            predictions.push(Math.max(0, prediction));
        }
        return predictions;
    }
    predictLinearRegression(features, coefficients, intercept) {
        return features.map(row => {
            let prediction = intercept;
            for (let i = 0; i < coefficients.length; i++) {
                prediction += coefficients[i] * row[i];
            }
            return prediction;
        });
    }
    calculateConfidenceIntervals(predictions) {
        return predictions.map(prediction => {
            const margin = prediction * 0.1;
            return {
                lower: Math.max(0, prediction - margin),
                upper: prediction + margin,
            };
        });
    }
    prepareHistoricalChartData(historicalData) {
        return historicalData
            .filter(row => row['年月'] && !isNaN(row['y']))
            .map(row => ({
            date: row['年月'],
            value: row['y'],
        }))
            .slice(-24);
    }
};
exports.PredictionService = PredictionService;
exports.PredictionService = PredictionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_service_1.ModelService,
        data_service_1.DataService])
], PredictionService);
//# sourceMappingURL=prediction.service.js.map