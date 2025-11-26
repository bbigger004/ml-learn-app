import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ModelService } from '../model/model.service';
import { DataService } from '../data/data.service';

@Injectable()
export class PredictionService {
  constructor(
    private readonly modelService: ModelService,
    private readonly dataService: DataService,
  ) {}

  async predict(modelId: string, periods: number = 6) {
    try {
      // 获取模型
      const modelInfo = this.modelService.getModel(modelId);
      if (!modelInfo) {
        throw new NotFoundException('模型不存在');
      }

      // 获取历史数据
      const historicalData = this.dataService.getCurrentData();
      if (!historicalData || historicalData.length === 0) {
        throw new BadRequestException('没有可用的历史数据');
      }

      // 生成未来时间序列
      const lastDate = this.getLastDate(historicalData);
      const futureDates = this.generateFutureDates(lastDate, periods);

      // 准备预测输入数据
      const predictions = this.generatePredictions(
        modelInfo,
        historicalData,
        periods,
      );

      // 计算置信区间
      const confidenceIntervals = this.calculateConfidenceIntervals(predictions);

      // 准备历史数据用于图表展示
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
    } catch (error) {
      throw new BadRequestException(`预测失败: ${error.message}`);
    }
  }

  async batchPredict(modelId: string, inputData: any[]) {
    const modelInfo = this.modelService.getModel(modelId);
    if (!modelInfo) {
      throw new NotFoundException('模型不存在');
    }

    try {
      const predictions = [];

      for (const input of inputData) {
        const inputValues = modelInfo.modelData.featureNames.map(feature =>
          Number(input[feature]) || 0
        );

        const prediction = this.predictLinearRegression(
          [inputValues],
          modelInfo.modelData.coefficients,
          modelInfo.modelData.intercept
        )[0];

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
    } catch (error) {
      throw new BadRequestException(`批量预测失败: ${error.message}`);
    }
  }

  async calculateConfidenceInterval(modelId: string, periods: number) {
    // 这里实现置信区间计算逻辑
    return {
      success: true,
      data: {
        modelId,
        periods,
        confidenceLevel: 0.95,
        intervals: Array.from({ length: periods }, (_, i) => ({
          period: i + 1,
          lower: Math.random() * 2 + 28, // 模拟数据
          upper: Math.random() * 2 + 32, // 模拟数据
        })),
      },
    };
  }

  private getLastDate(data: any[]): string {
    // 从数据中提取最后日期
    const dates = data.map(row => row['年月']).filter(date => date);
    const lastDate = dates[dates.length - 1] || '202412';
    // 确保返回字符串格式
    return String(lastDate);
  }

  private generateFutureDates(lastDate: string, periods: number): string[] {
    const dates: string[] = [];
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

  private generatePredictions(
    modelInfo: any,
    historicalData: any[],
    periods: number,
  ): number[] {
    const predictions: number[] = [];

    // 使用历史数据的最后几行作为预测基础
    const recentData = historicalData.slice(-10); // 使用最近10个时间点

    // 基于线性回归模型进行预测
    for (let i = 0; i < periods; i++) {
      // 使用历史数据的平均值作为特征输入
      const featureValues = modelInfo.modelData.featureNames.map(feature => {
        const values = recentData.map(row => Number(row[feature]) || 0);
        return values.reduce((a, b) => a + b, 0) / values.length;
      });

      const prediction = this.predictLinearRegression(
        [featureValues],
        modelInfo.modelData.coefficients,
        modelInfo.modelData.intercept
      )[0];

      predictions.push(Math.max(0, prediction)); // 确保非负值
    }

    return predictions;
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

  private calculateConfidenceIntervals(predictions: number[]) {
    return predictions.map(prediction => {
      const margin = prediction * 0.1; // 10%的置信区间
      return {
        lower: Math.max(0, prediction - margin),
        upper: prediction + margin,
      };
    });
  }

  private prepareHistoricalChartData(historicalData: any[]) {
    return historicalData
      .filter(row => row['年月'] && !isNaN(row['y']))
      .map(row => ({
        date: row['年月'],
        value: row['y'],
      }))
      .slice(-24); // 返回最近24个月的数据
  }
}