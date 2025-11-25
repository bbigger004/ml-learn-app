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
exports.ModelService = void 0;
const common_1 = require("@nestjs/common");
const data_service_1 = require("../data/data.service");
let ModelService = class ModelService {
    constructor(dataService) {
        this.dataService = dataService;
        this.models = new Map();
    }
    async trainModel(trainModelDto) {
        const startTime = Date.now();
        try {
            const currentData = this.dataService.getCurrentData();
            if (!currentData || currentData.length === 0) {
                throw new common_1.BadRequestException('请先上传并预处理数据');
            }
            const { features, labels } = this.prepareTrainingData(currentData, trainModelDto.selectedFeatures, trainModelDto.targetColumn);
            const testSize = trainModelDto.testSize || 0.2;
            const splitIndex = Math.floor(features.length * (1 - testSize));
            const trainFeatures = features.slice(0, splitIndex);
            const trainLabels = labels.slice(0, splitIndex);
            const testFeatures = features.slice(splitIndex);
            const testLabels = labels.slice(splitIndex);
            const { coefficients, intercept } = this.trainLinearRegression(trainFeatures, trainLabels);
            const predictions = this.predictLinearRegression(testFeatures, coefficients, intercept);
            const evaluation = this.evaluateModel(testLabels, predictions, trainLabels);
            const featureImportance = this.calculateFeatureImportance(trainModelDto.selectedFeatures, coefficients);
            const modelId = `model_${Date.now()}`;
            const trainingTime = Date.now() - startTime;
            const modelInfo = {
                modelId,
                trainingTime,
                evaluation,
                featureImportance,
                trainingParams: trainModelDto.modelParams || {},
                createdAt: new Date(),
                modelData: {
                    coefficients,
                    intercept,
                    featureNames: trainModelDto.selectedFeatures,
                },
            };
            this.models.set(modelId, modelInfo);
            return {
                success: true,
                message: '模型训练完成',
                data: {
                    modelId,
                    trainingTime: `${(trainingTime / 1000).toFixed(2)}s`,
                    evaluation,
                    featureImportance,
                    dataSummary: {
                        totalSamples: currentData.length,
                        trainingSamples: trainFeatures.length,
                        testSamples: testFeatures.length,
                        featureCount: trainModelDto.selectedFeatures.length,
                    },
                },
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`模型训练失败: ${error.message}`);
        }
    }
    async getModelEvaluation(modelId) {
        const modelInfo = this.models.get(modelId);
        if (!modelInfo) {
            throw new common_1.NotFoundException('模型不存在');
        }
        return {
            success: true,
            data: {
                modelId,
                evaluation: modelInfo.evaluation,
                featureImportance: modelInfo.featureImportance,
                trainingParams: modelInfo.trainingParams,
                createdAt: modelInfo.createdAt,
            },
        };
    }
    async getModelList() {
        const modelList = Array.from(this.models.entries()).map(([modelId, info]) => ({
            modelId,
            trainingTime: info.trainingTime,
            evaluation: info.evaluation,
            createdAt: info.createdAt,
        }));
        return {
            success: true,
            data: {
                models: modelList,
                totalCount: modelList.length,
            },
        };
    }
    async retrainModel(modelId, trainModelDto) {
        this.models.delete(modelId);
        return this.trainModel(trainModelDto);
    }
    getModel(modelId) {
        return this.models.get(modelId);
    }
    prepareTrainingData(data, selectedFeatures, targetColumn) {
        const features = [];
        const labels = [];
        data.forEach(row => {
            const featureValues = [];
            selectedFeatures.forEach(feature => {
                const value = row[feature];
                featureValues.push(Number(value) || 0);
            });
            const label = Number(row[targetColumn]);
            if (!isNaN(label) && featureValues.every(v => !isNaN(v))) {
                features.push(featureValues);
                labels.push(label);
            }
        });
        return { features, labels };
    }
    trainLinearRegression(features, labels) {
        const n = features.length;
        const m = features[0].length;
        let coefficients = new Array(m).fill(0);
        let intercept = 0;
        const learningRate = 0.01;
        const iterations = 1000;
        for (let iter = 0; iter < iterations; iter++) {
            let totalError = 0;
            for (let i = 0; i < n; i++) {
                let prediction = intercept;
                for (let j = 0; j < m; j++) {
                    prediction += coefficients[j] * features[i][j];
                }
                const error = prediction - labels[i];
                totalError += error * error;
                intercept -= learningRate * error;
                for (let j = 0; j < m; j++) {
                    coefficients[j] -= learningRate * error * features[i][j];
                }
            }
            if (totalError / n < 0.001) {
                break;
            }
        }
        return {
            intercept,
            coefficients,
        };
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
    evaluateModel(trueValues, predictions, trainLabels) {
        const mse = this.calculateMSE(trueValues, predictions);
        const rmse = Math.sqrt(mse);
        const mae = this.calculateMAE(trueValues, predictions);
        const r2 = this.calculateR2(trueValues, predictions, trainLabels);
        return {
            mse: Number(mse.toFixed(4)),
            rmse: Number(rmse.toFixed(4)),
            mae: Number(mae.toFixed(4)),
            r2: Number(r2.toFixed(4)),
        };
    }
    calculateFeatureImportance(features, coefficients) {
        const absCoefficients = coefficients.map(coef => Math.abs(coef));
        const totalImportance = absCoefficients.reduce((sum, coef) => sum + coef, 0);
        return features.map((feature, index) => ({
            feature,
            importance: totalImportance > 0 ? absCoefficients[index] / totalImportance : 0,
        })).sort((a, b) => b.importance - a.importance);
    }
    transpose(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }
    multiplyMatrices(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < a[0].length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }
    multiplyMatrixVector(matrix, vector) {
        return matrix.map(row => {
            let sum = 0;
            for (let i = 0; i < row.length; i++) {
                sum += row[i] * vector[i];
            }
            return sum;
        });
    }
    solveLinearSystem(A, b) {
        const n = A.length;
        const augmented = A.map((row, i) => [...row, b[i]]);
        for (let i = 0; i < n; i++) {
            let maxRow = i;
            for (let j = i + 1; j < n; j++) {
                if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
                    maxRow = j;
                }
            }
            [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
            for (let j = i + 1; j < n; j++) {
                const factor = augmented[j][i] / augmented[i][i];
                for (let k = i; k <= n; k++) {
                    augmented[j][k] -= factor * augmented[i][k];
                }
            }
        }
        const x = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
            x[i] = augmented[i][n];
            for (let j = i + 1; j < n; j++) {
                x[i] -= augmented[i][j] * x[j];
            }
            x[i] /= augmented[i][i];
        }
        return x;
    }
    calculateMSE(trueValues, predictions) {
        let sum = 0;
        for (let i = 0; i < trueValues.length; i++) {
            sum += Math.pow(trueValues[i] - predictions[i], 2);
        }
        return sum / trueValues.length;
    }
    calculateMAE(trueValues, predictions) {
        let sum = 0;
        for (let i = 0; i < trueValues.length; i++) {
            sum += Math.abs(trueValues[i] - predictions[i]);
        }
        return sum / trueValues.length;
    }
    calculateR2(trueValues, predictions, trainLabels) {
        const meanTrue = trainLabels.reduce((a, b) => a + b, 0) / trainLabels.length;
        const totalSumSquares = trainLabels.reduce((sum, val) => sum + Math.pow(val - meanTrue, 2), 0);
        const residualSumSquares = trueValues.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0);
        return 1 - (residualSumSquares / totalSumSquares);
    }
};
exports.ModelService = ModelService;
exports.ModelService = ModelService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [data_service_1.DataService])
], ModelService);
//# sourceMappingURL=model.service.js.map