import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
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
  featureImportance: Array<{ feature: string; importance: number }>;
  trainingParams: any;
  createdAt: Date;
  modelData: {
    coefficients: number[];
    intercept: number;
    featureNames: string[];
  };
}

@Injectable()
export class ModelService {
  private models: Map<string, ModelInfo> = new Map();

  constructor(private readonly dataService: DataService) {}

  async trainModel(trainModelDto: {
    selectedFeatures: string[];
    targetColumn: string;
    testSize?: number;
    modelParams?: any;
  }) {
    const startTime = Date.now();

    try {
      // 获取当前数据
      const currentData = this.dataService.getCurrentData();
      if (!currentData || currentData.length === 0) {
        throw new BadRequestException('请先上传并预处理数据');
      }

      // 数据预处理
      const { features, labels } = this.prepareTrainingData(
        currentData,
        trainModelDto.selectedFeatures,
        trainModelDto.targetColumn,
      );

      // 数据分割
      const testSize = trainModelDto.testSize || 0.2;
      const splitIndex = Math.floor(features.length * (1 - testSize));

      const trainFeatures = features.slice(0, splitIndex);
      const trainLabels = labels.slice(0, splitIndex);
      const testFeatures = features.slice(splitIndex);
      const testLabels = labels.slice(splitIndex);

      // 训练线性回归模型
      const { coefficients, intercept } = this.trainLinearRegression(
        trainFeatures,
        trainLabels,
      );

      // 模型评估
      const predictions = this.predictLinearRegression(testFeatures, coefficients, intercept);
      const evaluation = this.evaluateModel(testLabels, predictions, trainLabels);

      // 计算特征重要性
      const featureImportance = this.calculateFeatureImportance(
        trainModelDto.selectedFeatures,
        coefficients,
      );

      // 保存模型信息
      const modelId = `model_${Date.now()}`;
      const trainingTime = Date.now() - startTime;

      const modelInfo: ModelInfo = {
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
    } catch (error) {
      throw new BadRequestException(`模型训练失败: ${error.message}`);
    }
  }

  async getModelEvaluation(modelId: string) {
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) {
      throw new NotFoundException('模型不存在');
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

  async retrainModel(modelId: string, trainModelDto: any) {
    // 删除旧模型
    this.models.delete(modelId);
    // 重新训练
    return this.trainModel(trainModelDto);
  }

  getModel(modelId: string): ModelInfo | undefined {
    return this.models.get(modelId);
  }

  private prepareTrainingData(
    data: any[],
    selectedFeatures: string[],
    targetColumn: string,
  ) {
    const features: number[][] = [];
    const labels: number[] = [];

    data.forEach(row => {
      const featureValues: number[] = [];

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

    // 特征标准化
    const normalizedFeatures = this.standardizeFeatures(features);

    return { features: normalizedFeatures, labels };
  }

  private standardizeFeatures(features: number[][]): number[][] {
    if (features.length === 0) return features;

    const numFeatures = features[0].length;
    const means = new Array(numFeatures).fill(0);
    const stds = new Array(numFeatures).fill(0);

    // 计算每个特征的均值和标准差
    for (let j = 0; j < numFeatures; j++) {
      const values = features.map(row => row[j]);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

      means[j] = mean;
      stds[j] = std === 0 ? 1 : std; // 避免除零
    }

    // 标准化特征
    return features.map(row =>
      row.map((val, j) => (val - means[j]) / stds[j])
    );
  }

  private trainLinearRegression(features: number[][], labels: number[]) {
    // 使用改进的梯度下降法实现线性回归
    const n = features.length;
    const m = features[0].length;

    // 初始化参数
    let coefficients = new Array(m).fill(0);
    let intercept = 0;
    let learningRate = 0.1;
    const iterations = 5000;

    // 存储历史损失用于监控
    const lossHistory: number[] = [];

    // 批量梯度下降
    for (let iter = 0; iter < iterations; iter++) {
      let gradientIntercept = 0;
      const gradientCoefficients = new Array(m).fill(0);
      let totalError = 0;

      // 计算梯度
      for (let i = 0; i < n; i++) {
        // 预测值
        let prediction = intercept;
        for (let j = 0; j < m; j++) {
          prediction += coefficients[j] * features[i][j];
        }

        // 误差
        const error = prediction - labels[i];
        totalError += error * error;

        // 累计梯度
        gradientIntercept += error;
        for (let j = 0; j < m; j++) {
          gradientCoefficients[j] += error * features[i][j];
        }
      }

      // 计算平均梯度
      gradientIntercept /= n;
      for (let j = 0; j < m; j++) {
        gradientCoefficients[j] /= n;
      }

      // 更新参数
      intercept -= learningRate * gradientIntercept;
      for (let j = 0; j < m; j++) {
        coefficients[j] -= learningRate * gradientCoefficients[j];
      }

      // 记录损失
      const avgLoss = totalError / n;
      lossHistory.push(avgLoss);

      // 自适应学习率调整
      if (iter > 0 && lossHistory[iter] > lossHistory[iter - 1]) {
        learningRate *= 0.8; // 损失增加时减小学习率
      }

      // 提前停止条件
      if (avgLoss < 0.001 || (iter > 10 && Math.abs(lossHistory[iter] - lossHistory[iter - 1]) < 1e-6)) {
        break;
      }
    }

    return {
      intercept,
      coefficients,
    };
  }

  private predictLinearRegression(features: number[][], coefficients: number[], intercept: number): number[] {
    return features.map(row => {
      let prediction = intercept;
      for (let i = 0; i < coefficients.length; i++) {
        prediction += coefficients[i] * row[i];
      }
      return prediction;
    });
  }

  private evaluateModel(
    trueValues: number[],
    predictions: number[],
    trainLabels: number[],
  ) {
    // 计算MSE
    const mse = this.calculateMSE(trueValues, predictions);

    // 计算RMSE
    const rmse = Math.sqrt(mse);

    // 计算MAE
    const mae = this.calculateMAE(trueValues, predictions);

    // 计算R²
    const r2 = this.calculateR2(trueValues, predictions, trainLabels);

    return {
      mse: Number(mse.toFixed(4)),
      rmse: Number(rmse.toFixed(4)),
      mae: Number(mae.toFixed(4)),
      r2: Number(r2.toFixed(4)),
    };
  }

  private calculateFeatureImportance(
    features: string[],
    coefficients: number[],
  ) {
    // 使用系数的绝对值作为特征重要性
    const absCoefficients = coefficients.map(coef => Math.abs(coef));
    const totalImportance = absCoefficients.reduce((sum, coef) => sum + coef, 0);

    return features.map((feature, index) => ({
      feature,
      importance: totalImportance > 0 ? absCoefficients[index] / totalImportance : 0,
    })).sort((a, b) => b.importance - a.importance);
  }

  // 线性代数辅助方法
  private transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
  }

  private multiplyMatrices(a: number[][], b: number[][]): number[][] {
    const result: number[][] = [];
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

  private multiplyMatrixVector(matrix: number[][], vector: number[]): number[] {
    return matrix.map(row => {
      let sum = 0;
      for (let i = 0; i < row.length; i++) {
        sum += row[i] * vector[i];
      }
      return sum;
    });
  }

  private solveLinearSystem(A: number[][], b: number[]): number[] {
    // 使用高斯消元法求解线性方程组
    const n = A.length;
    const augmented = A.map((row, i) => [...row, b[i]]);

    // 前向消元
    for (let i = 0; i < n; i++) {
      // 寻找主元
      let maxRow = i;
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j;
        }
      }

      // 交换行
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];

      // 消元
      for (let j = i + 1; j < n; j++) {
        const factor = augmented[j][i] / augmented[i][i];
        for (let k = i; k <= n; k++) {
          augmented[j][k] -= factor * augmented[i][k];
        }
      }
    }

    // 回代
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

  private calculateMSE(trueValues: number[], predictions: number[]): number {
    let sum = 0;
    for (let i = 0; i < trueValues.length; i++) {
      sum += Math.pow(trueValues[i] - predictions[i], 2);
    }
    return sum / trueValues.length;
  }

  private calculateMAE(trueValues: number[], predictions: number[]): number {
    let sum = 0;
    for (let i = 0; i < trueValues.length; i++) {
      sum += Math.abs(trueValues[i] - predictions[i]);
    }
    return sum / trueValues.length;
  }

  private calculateR2(trueValues: number[], predictions: number[], trainLabels: number[]): number {
    const meanTrue = trainLabels.reduce((a, b) => a + b, 0) / trainLabels.length;
    const totalSumSquares = trainLabels.reduce((sum, val) => sum + Math.pow(val - meanTrue, 2), 0);
    const residualSumSquares = trueValues.reduce((sum, val, i) => sum + Math.pow(val - predictions[i], 2), 0);

    return 1 - (residualSumSquares / totalSumSquares);
  }
}