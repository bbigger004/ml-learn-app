import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
// 暂时注释掉TensorFlow引用
// import * as tf from '@tensorflow/tfjs-node';
// 模拟tf对象，避免编译错误
const tf = {
  tensor: () => ({
    predict: () => ({
      dataSync: () => []
    })
  }),
  tidy: (fn: Function) => fn()
} as any;
import { ModelService } from '../model/model.service';
import { DataService } from '../data/data.service';

@Injectable()
export class PredictionService {
  constructor(
    private readonly modelService: ModelService,
    private readonly dataService: DataService
  ) {}

  /**
   * 预测未来6个月的y值
   */
  async predictFuture(
    modelId: string,
    historicalData: any[],
    features: string[],
    target: string,
    lookback: number = 6,
    months: number = 6
  ): Promise<any> {
    try {
      // 加载模型
      const model = await this.modelService.loadModel(modelId);
      
      // 确保有足够的历史数据
      if (historicalData.length < lookback) {
        throw new Error(`历史数据不足，需要至少${lookback}条记录`);
      }
      
      // 排序历史数据（按时间顺序）
      const sortedData = [...historicalData].sort((a, b) => {
        const dateA = a['年月'] || a['日期'] || 0;
        const dateB = b['年月'] || b['日期'] || 0;
        return dateA - dateB;
      });
      
      // 准备预测数据
      let predictions = [];
      let lastDataPoints = sortedData.slice(-lookback);
      
      // 逐月预测
      for (let i = 0; i < months; i++) {
        // 准备输入数据
        const inputData = lastDataPoints.map(point => 
          features.map(feature => point[feature] || 0)
        );
        
        // 创建输入张量
        const inputTensor = tf.tensor2d(inputData).reshape([1, lookback, features.length]);
        
        // 进行预测
        const prediction = model.predict(inputTensor) as any;
        const predictedValue = prediction.dataSync()[0];
        
        // 清理张量
        inputTensor.dispose();
        prediction.dispose();
        
        // 计算下一个月份
        const lastDate = lastDataPoints[lastDataPoints.length - 1]['年月'];
        const nextDate = this.calculateNextMonth(lastDate);
        
        // 创建预测结果对象
        const predictionResult = {
          年月: nextDate,
          [target]: predictedValue,
          预测: true,
        };
        
        // 复制特征值（实际应用中可能需要根据业务逻辑更新特征值）
        features.forEach(feature => {
          if (feature !== target) {
            predictionResult[feature] = lastDataPoints[lastDataPoints.length - 1][feature];
          }
        });
        
        predictions.push(predictionResult);
        
        // 更新用于下一次预测的数据点
        lastDataPoints = [...lastDataPoints.slice(1), predictionResult];
      }
      
      // 计算置信区间（简化版本）
      // 实际应用中应该使用更复杂的方法计算置信区间
      const historicalValues = sortedData.map(d => d[target]).filter(v => v !== undefined && !isNaN(v));
      const stdDev = this.calculateStandardDeviation(historicalValues);
      
      const predictionsWithConfidence = predictions.map(pred => ({
        ...pred,
        下限: Math.max(0, pred[target] - 1.96 * stdDev), // 95%置信区间下限
        上限: pred[target] + 1.96 * stdDev, // 95%置信区间上限
      }));
      
      return {
        predictions: predictionsWithConfidence,
        historicalData: sortedData.slice(-24), // 返回最近24个月的历史数据用于对比
        confidenceLevel: 0.95,
        standardDeviation: stdDev,
      };
    } catch (error) {
      throw new HttpException(
        `预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 计算下一个月份
   */
  private calculateNextMonth(yearMonth: number): number {
    const year = Math.floor(yearMonth / 100);
    const month = yearMonth % 100;
    
    let nextMonth = month + 1;
    let nextYear = year;
    
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    
    return nextYear * 100 + nextMonth;
  }

  /**
   * 计算标准差
   */
  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * 批量预测
   */
  async batchPredict(
    modelId: string,
    predictionRequests: any[],
    features: string[],
    target: string,
    lookback: number = 6
  ): Promise<any[]> {
    try {
      const results = [];
      
      for (const request of predictionRequests) {
        // 为每个请求单独预测
        const result = await this.predictFuture(
          modelId,
          request.historicalData,
          features,
          target,
          lookback,
          request.months || 6
        );
        
        results.push({
          requestId: request.id,
          ...result,
        });
      }
      
      return results;
    } catch (error) {
      throw new HttpException(
        `批量预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 基于样本数据进行预测
   */
  async predictFromSampleData(
    modelId: string,
    features: string[],
    target: string,
    months: number = 6
  ): Promise<any> {
    try {
      // 获取样本数据
      const rawData = await this.dataService.getSampleData();
      const preprocessedData = this.dataService.preprocessData(rawData);
      
      // 按小区分组
      const dataByCommunity = this.groupByCommunity(preprocessedData);
      
      // 对每个小区进行预测
      const communityPredictions = {};
      
      for (const [communityId, communityData] of Object.entries(dataByCommunity)) {
        // 限制处理的小区数量，避免资源耗尽
        if (Object.keys(communityPredictions).length >= 10) {
          break;
        }
        
        const prediction = await this.predictFuture(
          modelId,
          communityData,
          features,
          target,
          6,
          months
        );
        
        communityPredictions[communityId] = prediction;
      }
      
      return {
        communityPredictions,
        totalCommunities: Object.keys(dataByCommunity).length,
        processedCommunities: Object.keys(communityPredictions).length,
      };
    } catch (error) {
      throw new HttpException(
        `基于样本数据预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 按小区ID分组数据
   */
  private groupByCommunity(data: any[]): Record<string, any[]> {
    const grouped = {};
    
    data.forEach(item => {
      const communityId = item['小区ID'];
      if (!grouped[communityId]) {
        grouped[communityId] = [];
      }
      grouped[communityId].push(item);
    });
    
    return grouped;
  }
}