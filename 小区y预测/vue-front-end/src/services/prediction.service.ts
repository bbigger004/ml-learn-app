import axios from 'axios';

// API基础URL
const API_URL = process.env.VUE_APP_API_URL || 'http://localhost:3000';

class PredictionService {
  /**
   * 获取预测结果
   * @param modelId 模型ID
   * @param inputData 输入数据
   * @param lookback 回看窗口
   * @param features 特征列表
   * @returns 预测结果
   */
  async getPrediction(modelId: string, inputData: any[], lookback: number, features: string[]) {
    try {
      const response = await axios.post(`${API_URL}/model/predict`, {
        modelId,
        inputData,
        lookback,
        features
      });
      return response.data;
    } catch (error) {
      console.error('获取预测结果失败:', error);
      throw error;
    }
  }

  /**
   * 批量预测
   * @param modelId 模型ID
   * @param batchData 批量数据
   * @param lookback 回看窗口
   * @param features 特征列表
   * @returns 批量预测结果
   */
  async batchPredict(modelId: string, batchData: any[], lookback: number, features: string[]) {
    try {
      const response = await axios.post(`${API_URL}/model/batch-predict`, {
        modelId,
        batchData,
        lookback,
        features
      });
      return response.data;
    } catch (error) {
      console.error('批量预测失败:', error);
      throw error;
    }
  }

  /**
   * 多步预测
   * @param modelId 模型ID
   * @param inputData 输入数据
   * @param steps 预测步数
   * @param lookback 回看窗口
   * @param features 特征列表
   * @returns 多步预测结果
   */
  async multiStepPredict(modelId: string, inputData: any[], steps: number, lookback: number, features: string[]) {
    try {
      const response = await axios.post(`${API_URL}/model/multi-step-predict`, {
        modelId,
        inputData,
        steps,
        lookback,
        features
      });
      return response.data;
    } catch (error) {
      console.error('多步预测失败:', error);
      throw error;
    }
  }

  /**
   * 模型比较
   * @param modelIds 模型ID列表
   * @param features 特征列表
   * @param target 目标变量
   * @param lookback 回看窗口
   * @returns 模型比较结果
   */
  async compareModels(modelIds: string[], features: string[], target: string, lookback: number) {
    try {
      const response = await axios.post(`${API_URL}/model/compare-models`, {
        modelIds,
        features,
        target,
        lookback
      });
      return response.data;
    } catch (error) {
      console.error('模型比较失败:', error);
      throw error;
    }
  }

  /**
   * 超参数优化
   * @param modelType 模型类型
   * @param features 特征列表
   * @param target 目标变量
   * @param paramSpace 参数空间
   * @param iterations 迭代次数
   * @param useSampleData 是否使用示例数据
   * @param testRatio 测试集比例
   * @returns 超参数优化结果
   */
  async optimizeHyperparameters(modelType: string, features: string[], target: string, paramSpace: any, iterations: number = 10, useSampleData: boolean = true, testRatio: number = 0.2) {
    try {
      const response = await axios.post(`${API_URL}/model/optimize-hyperparams`, {
        modelType,
        features,
        target,
        paramSpace,
        iterations,
        useSampleData,
        testRatio
      });
      return response.data;
    } catch (error) {
      console.error('超参数优化失败:', error);
      throw error;
    }
  }

  /**
   * 获取模型评估结果
   * @param modelId 模型ID
   * @param features 特征列表
   * @param target 目标变量
   * @param lookback 回看窗口
   * @returns 模型评估结果
   */
  async evaluateModel(modelId: string, features: string[], target: string, lookback: number) {
    try {
      const response = await axios.get(`${API_URL}/model/evaluate`, {
        params: {
          modelId,
          features: features.join(','),
          target,
          lookback
        }
      });
      return response.data;
    } catch (error) {
      console.error('模型评估失败:', error);
      throw error;
    }
  }

  /**
   * 获取预测历史
   * @param modelId 模型ID（可选）
   * @param limit 限制数量
   * @returns 预测历史记录
   */
  async getPredictionHistory(modelId?: string, limit: number = 10) {
    try {
      // 模拟数据 - 实际应用中应该从后端获取
      return {
        message: '获取预测历史成功',
        history: [
          {
            id: '1',
            modelId: 'model-2024-01-01-000001',
            timestamp: '2024-01-01T10:00:00Z',
            inputData: [{ '年月': '2024-01', '小区ID': 'A001', 'y': 100 }],
            prediction: [105.2],
            metrics: { mse: 2.5, mae: 1.2 }
          },
          {
            id: '2',
            modelId: 'model-2024-01-01-000001',
            timestamp: '2024-01-02T14:30:00Z',
            inputData: [{ '年月': '2024-02', '小区ID': 'A001', 'y': 105 }],
            prediction: [110.8],
            metrics: { mse: 3.1, mae: 1.5 }
          },
          {
            id: '3',
            modelId: 'model-2024-01-02-000002',
            timestamp: '2024-01-03T09:15:00Z',
            inputData: [{ '年月': '2024-03', '小区ID': 'A001', 'y': 110 }],
            prediction: [115.3],
            metrics: { mse: 1.9, mae: 1.1 }
          }
        ]
      };
    } catch (error) {
      console.error('获取预测历史失败:', error);
      throw error;
    }
  }

  /**
   * 生成可视化数据
   * @param actualData 实际数据
   * @param predictedData 预测数据
   * @param metrics 评估指标
   * @returns 可视化数据
   */
  generateVisualizationData(actualData: number[], predictedData: number[], metrics: any) {
    return {
      actual: actualData,
      predicted: predictedData,
      metrics,
      // 计算残差
      residuals: actualData.map((actual, index) => actual - predictedData[index]),
      // 计算预测区间（简单实现）
      confidenceInterval: predictedData.map((pred) => ({
        lower: pred * 0.95,
        upper: pred * 1.05
      }))
    };
  }
}

export default new PredictionService();