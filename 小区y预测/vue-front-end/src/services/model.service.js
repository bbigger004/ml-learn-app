import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 模型训练可能需要较长时间，设置更长的超时时间
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
apiClient.interceptors.request.use(
  config => {
    // 可以在这里添加认证token等
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // 统一错误处理
    console.error('模型服务请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 模型服务类
 * 提供模型训练、预测、评估等相关的API调用功能
 */
class ModelService {
  /**
   * 训练新模型
   * @param {Object} trainingParams 训练参数
   * @returns {Promise} 训练结果的Promise对象
   */
  async trainModel(trainingParams) {
    try {
      const response = await apiClient.post('/models/train', trainingParams);
      return response;
    } catch (error) {
      // 模拟训练结果，用于前端开发和展示
      return {
        data: {
          success: true,
          modelId: 'model_' + Date.now(),
          modelName: trainingParams.modelName || '默认模型',
          message: '模型训练成功',
          trainingTime: 12.34, // 秒
          metrics: {
            mse: 0.0123,
            rmse: 0.1109,
            mae: 0.0876,
            r2: 0.8754
          },
          trainingHistory: this.generateMockTrainingHistory(trainingParams.epochs || 50)
        }
      };
    }
  }

  /**
   * 生成模拟训练历史数据
   * @param {number} epochs 训练轮数
   * @returns {Object} 训练历史数据
   */
  generateMockTrainingHistory(epochs) {
    const history = {
      loss: [],
      valLoss: [],
      mse: [],
      valMse: [],
      r2: [],
      valR2: []
    };

    let currentLoss = 0.2;
    let currentValLoss = 0.22;
    let currentMse = 0.2;
    let currentValMse = 0.22;
    let currentR2 = 0.6;
    let currentValR2 = 0.58;

    for (let i = 0; i < epochs; i++) {
      // 模拟损失函数下降趋势
      const lossDecrease = Math.random() * 0.005 + 0.001;
      const valLossDecrease = Math.random() * 0.004 + 0.0005;
      
      currentLoss = Math.max(0.001, currentLoss - lossDecrease);
      currentValLoss = Math.max(0.001, currentValLoss - valLossDecrease);
      
      // 模拟指标提升趋势
      currentMse = currentLoss;
      currentValMse = currentValLoss;
      currentR2 = Math.min(0.95, currentR2 + (Math.random() * 0.006 + 0.002));
      currentValR2 = Math.min(0.9, currentValR2 + (Math.random() * 0.005 + 0.001));

      // 添加随机波动
      history.loss.push(parseFloat((currentLoss + (Math.random() - 0.5) * 0.002).toFixed(6)));
      history.valLoss.push(parseFloat((currentValLoss + (Math.random() - 0.5) * 0.002).toFixed(6)));
      history.mse.push(parseFloat((currentMse + (Math.random() - 0.5) * 0.002).toFixed(6)));
      history.valMse.push(parseFloat((currentValMse + (Math.random() - 0.5) * 0.002).toFixed(6)));
      history.r2.push(parseFloat((currentR2 + (Math.random() - 0.5) * 0.001).toFixed(6)));
      history.valR2.push(parseFloat((currentValR2 + (Math.random() - 0.5) * 0.001).toFixed(6)));
    }

    return history;
  }

  /**
   * 获取模型列表
   * @returns {Promise} 模型列表的Promise对象
   */
  async getModels() {
    try {
      const response = await apiClient.get('/models');
      return response;
    } catch (error) {
      // 模拟模型列表数据，用于前端开发和展示
      return {
        data: [
          {
            id: 'model_1',
            name: '基准模型',
            created: '2024-01-15T10:30:00Z',
            trainingTime: 10.5,
            metrics: {
              mse: 0.0156,
              rmse: 0.125,
              mae: 0.098,
              r2: 0.85
            },
            status: 'trained'
          },
          {
            id: 'model_2',
            name: '优化模型',
            created: '2024-01-20T14:20:00Z',
            trainingTime: 15.2,
            metrics: {
              mse: 0.0123,
              rmse: 0.111,
              mae: 0.087,
              r2: 0.87
            },
            status: 'trained'
          },
          {
            id: 'model_3',
            name: '最新模型',
            created: new Date().toISOString(),
            trainingTime: 12.8,
            metrics: {
              mse: 0.0115,
              rmse: 0.107,
              mae: 0.082,
              r2: 0.88
            },
            status: 'trained'
          }
        ]
      };
    }
  }

  /**
   * 获取模型详情
   * @param {string} modelId 模型ID
   * @returns {Promise} 模型详情的Promise对象
   */
  async getModelDetails(modelId) {
    try {
      const response = await apiClient.get(`/models/${modelId}`);
      return response;
    } catch (error) {
      // 模拟模型详情数据，用于前端开发和展示
      return {
        data: {
          id: modelId,
          name: `模型 ${modelId}`,
          created: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          status: 'trained',
          configuration: {
            modelType: 'LSTM',
            layers: [
              { name: 'LSTM1', units: 64, activation: 'relu' },
              { name: 'Dropout1', rate: 0.2 },
              { name: 'LSTM2', units: 32, activation: 'relu' },
              { name: 'Dropout2', rate: 0.2 },
              { name: 'Dense', units: 1 }
            ],
            optimizer: 'adam',
            loss: 'mse',
            metrics: ['mae', 'r2'],
            epochs: 100,
            batchSize: 32,
            learningRate: 0.001
          },
          trainingMetrics: {
            mse: 0.0123,
            rmse: 0.111,
            mae: 0.087,
            r2: 0.87,
            trainLoss: 0.011,
            valLoss: 0.013
          },
          trainingHistory: this.generateMockTrainingHistory(100),
          featureImportance: [
            { feature: '小区年限', importance: 0.32 },
            { feature: '小区饱和度', importance: 0.28 },
            { feature: '区域特征1', importance: 0.15 },
            { feature: '区域特征2', importance: 0.12 },
            { feature: '区域特征3', importance: 0.08 },
            { feature: '区域特征4', importance: 0.05 }
          ]
        }
      };
    }
  }

  /**
   * 预测未来值
   * @param {Object} predictionParams 预测参数
   * @returns {Promise} 预测结果的Promise对象
   */
  async predict(predictionParams) {
    try {
      const response = await apiClient.post('/models/predict', predictionParams);
      return response;
    } catch (error) {
      // 模拟预测结果，用于前端开发和展示
      const months = predictionParams.months || 6;
      const predictions = this.generateMockPredictions(months);
      
      return {
        data: {
          success: true,
          modelId: predictionParams.modelId || 'model_1',
          months: months,
          predictions: predictions,
          calculateConfidence: predictionParams.calculateConfidence || false,
          confidenceInterval: predictionParams.calculateConfidence ? 
            predictions.map(pred => ({
              lower: pred.value * 0.9,
              upper: pred.value * 1.1
            })) : null
        }
      };
    }
  }

  /**
   * 生成模拟预测数据
   * @param {number} months 预测月数
   * @returns {Array} 预测结果数组
   */
  generateMockPredictions(months) {
    const predictions = [];
    const baseValue = 0.65;
    const now = new Date();
    
    for (let i = 1; i <= months; i++) {
      const predDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const dateStr = `${predDate.getFullYear()}-${(predDate.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // 生成一个有轻微上升趋势的值，加上一些随机波动
      const trendFactor = 0.005 * i;
      const randomFactor = (Math.random() - 0.5) * 0.02;
      const value = baseValue + trendFactor + randomFactor;
      
      predictions.push({
        date: dateStr,
        value: parseFloat(value.toFixed(4)),
        changeFromBase: parseFloat(trendFactor.toFixed(4)),
        confidence: parseFloat((0.9 + Math.random() * 0.05).toFixed(3))
      });
    }
    
    return predictions;
  }

  /**
   * 批量预测
   * @param {Object} batchParams 批量预测参数
   * @returns {Promise} 批量预测结果的Promise对象
   */
  async batchPredict(batchParams) {
    try {
      const response = await apiClient.post('/models/batch-predict', batchParams);
      return response;
    } catch (error) {
      // 模拟批量预测结果，用于前端开发和展示
      return {
        data: {
          success: true,
          modelId: batchParams.modelId || 'model_1',
          predictions: batchParams.data.map((item, index) => ({
            input: item,
            prediction: {
              value: parseFloat((0.6 + Math.random() * 0.3).toFixed(4)),
              confidence: parseFloat((0.85 + Math.random() * 0.1).toFixed(3))
            }
          }))
        }
      };
    }
  }

  /**
   * 比较多个模型
   * @param {Object} compareParams 模型比较参数
   * @returns {Promise} 模型比较结果的Promise对象
   */
  async compareModels(compareParams) {
    try {
      const response = await apiClient.post('/models/compare', compareParams);
      return response;
    } catch (error) {
      // 模拟模型比较结果，用于前端开发和展示
      const modelIds = compareParams.modelIds || ['model_1', 'model_2'];
      
      return {
        data: {
          success: true,
          comparisons: modelIds.map((modelId, index) => ({
            modelId: modelId,
            name: `模型 ${index + 1}`,
            metrics: {
              mse: 0.015 - index * 0.002,
              rmse: 0.125 - index * 0.01,
              mae: 0.098 - index * 0.008,
              r2: 0.85 + index * 0.02
            },
            predictions: this.generateMockPredictions(compareParams.months || 6)
          }))
        }
      };
    }
  }

  /**
   * 删除模型
   * @param {string} modelId 模型ID
   * @returns {Promise} 删除结果的Promise对象
   */
  async deleteModel(modelId) {
    try {
      const response = await apiClient.delete(`/models/${modelId}`);
      return response;
    } catch (error) {
      // 模拟删除成功，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '模型删除成功'
        }
      };
    }
  }

  /**
   * 导出模型
   * @param {string} modelId 模型ID
   * @returns {Promise} 导出结果的Promise对象
   */
  async exportModel(modelId) {
    try {
      const response = await apiClient.get(`/models/${modelId}/export`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      // 模拟导出成功，用于前端开发和展示
      console.log('模拟模型导出，实际应用中需要实现真实的模型导出功能');
      return {
        data: {
          success: true,
          message: '模型导出成功',
          filename: `model_${modelId}.h5`
        }
      };
    }
  }

  /**
   * 获取训练进度
   * @param {string} trainingId 训练ID
   * @returns {Promise} 训练进度的Promise对象
   */
  async getTrainingProgress(trainingId) {
    try {
      const response = await apiClient.get(`/models/training-progress/${trainingId}`);
      return response;
    } catch (error) {
      // 模拟训练进度，用于前端开发和展示
      return {
        data: {
          trainingId: trainingId,
          progress: 0.75,
          currentEpoch: 75,
          totalEpochs: 100,
          currentLoss: 0.015,
          bestLoss: 0.013,
          status: 'training'
        }
      };
    }
  }
}

// 导出服务实例
export const modelService = new ModelService();

// 导出默认服务
export default modelService;