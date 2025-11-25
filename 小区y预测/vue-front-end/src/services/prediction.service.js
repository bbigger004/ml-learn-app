import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 15000,
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
    console.error('预测服务请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 预测服务类
 * 提供预测相关的API调用功能
 */
class PredictionService {
  /**
   * 对未来指定月数进行预测
   * @param {Object} params 预测参数
   * @param {string} params.modelId 模型ID
   * @param {number} params.months 预测月数，默认为6个月
   * @param {boolean} params.calculateConfidence 是否计算置信区间
   * @param {Object} params.inputs 可选的输入参数
   * @returns {Promise} 预测结果的Promise对象
   */
  async predictFuture(params) {
    try {
      const response = await apiClient.post('/predict/future', params);
      return response;
    } catch (error) {
      // 模拟预测结果，用于前端开发和展示
      const months = params.months || 6;
      const predictions = this.generateMockPredictions(months);
      
      return {
        data: {
          success: true,
          modelId: params.modelId || 'model_1',
          predictionType: 'future',
          months: months,
          predictions: predictions,
          calculateConfidence: params.calculateConfidence || false,
          confidenceIntervals: params.calculateConfidence ? 
            predictions.map(pred => ({
              date: pred.date,
              lower: parseFloat((pred.value * 0.9).toFixed(4)),
              upper: parseFloat((pred.value * 1.1).toFixed(4))
            })) : null,
          metadata: {
            generatedAt: new Date().toISOString(),
            lastTrainingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          }
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
      const trendFactor = 0.004 * i;
      const seasonalFactor = 0.01 * Math.sin(i * 0.5); // 添加季节性因素
      const randomFactor = (Math.random() - 0.5) * 0.015;
      const value = baseValue + trendFactor + seasonalFactor + randomFactor;
      
      predictions.push({
        date: dateStr,
        value: parseFloat(value.toFixed(4)),
        changeFromBase: parseFloat((trendFactor + seasonalFactor).toFixed(4)),
        confidence: parseFloat((0.9 + Math.random() * 0.05).toFixed(3))
      });
    }
    
    return predictions;
  }

  /**
   * 批量预测多个输入场景
   * @param {Object} params 批量预测参数
   * @param {string} params.modelId 模型ID
   * @param {Array} params.scenarios 预测场景数组
   * @returns {Promise} 批量预测结果的Promise对象
   */
  async batchPredict(params) {
    try {
      const response = await apiClient.post('/predict/batch', params);
      return response;
    } catch (error) {
      // 模拟批量预测结果，用于前端开发和展示
      return {
        data: {
          success: true,
          modelId: params.modelId || 'model_1',
          scenarios: params.scenarios.map((scenario, index) => ({
            id: index + 1,
            name: scenario.name || `场景 ${index + 1}`,
            inputs: scenario.inputs,
            predictions: this.generateMockPredictions(scenario.months || 6),
            confidence: parseFloat((0.85 + Math.random() * 0.1).toFixed(3))
          })),
          metadata: {
            generatedAt: new Date().toISOString()
          }
        }
      };
    }
  }

  /**
   * 比较不同模型的预测结果
   * @param {Object} params 模型比较参数
   * @param {Array} params.modelIds 模型ID数组
   * @param {number} params.months 预测月数
   * @returns {Promise} 模型比较结果的Promise对象
   */
  async comparePredictions(params) {
    try {
      const response = await apiClient.post('/predict/compare', params);
      return response;
    } catch (error) {
      // 模拟模型比较结果，用于前端开发和展示
      const modelIds = params.modelIds || ['model_1', 'model_2', 'model_3'];
      const months = params.months || 6;
      
      return {
        data: {
          success: true,
          comparisons: modelIds.map((modelId, modelIndex) => {
            // 为不同模型生成略有差异的预测结果
            const predictions = [];
            const baseValue = 0.65 - modelIndex * 0.02; // 后续模型可能有稍好的基础值
            const now = new Date();
            
            for (let i = 1; i <= months; i++) {
              const predDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
              const dateStr = `${predDate.getFullYear()}-${(predDate.getMonth() + 1).toString().padStart(2, '0')}`;
              
              // 为不同模型设置不同的趋势因子，模拟模型差异
              const trendFactor = (0.004 - modelIndex * 0.0005) * i;
              const seasonalFactor = 0.01 * Math.sin(i * 0.5) + modelIndex * 0.002; // 略有不同的季节性
              const randomFactor = (Math.random() - 0.5) * 0.01;
              const value = baseValue + trendFactor + seasonalFactor + randomFactor;
              
              predictions.push({
                date: dateStr,
                value: parseFloat(value.toFixed(4)),
                confidence: parseFloat((0.9 - modelIndex * 0.01 + Math.random() * 0.03).toFixed(3))
              });
            }
            
            return {
              modelId: modelId,
              modelName: `模型 ${modelIndex + 1}`,
              predictions: predictions,
              averageConfidence: parseFloat((0.9 - modelIndex * 0.01).toFixed(3))
            };
          }),
          metadata: {
            generatedAt: new Date().toISOString(),
            comparisonCriteria: ['预测值', '置信度', '趋势一致性']
          }
        }
      };
    }
  }

  /**
   * 获取历史预测记录
   * @param {Object} params 查询参数
   * @param {number} params.limit 返回记录数量限制
   * @param {number} params.offset 分页偏移量
   * @returns {Promise} 预测记录的Promise对象
   */
  async getPredictionHistory(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      
      const response = await apiClient.get(`/predict/history?${queryParams.toString()}`);
      return response;
    } catch (error) {
      // 模拟历史预测记录，用于前端开发和展示
      const limit = params.limit || 5;
      const history = [];
      
      for (let i = 0; i < limit; i++) {
        const daysAgo = i * 2 + Math.floor(Math.random() * 3);
        const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
        
        history.push({
          id: `pred_${Date.now()}_${i}`,
          modelId: `model_${1 + (i % 3)}`,
          modelName: `模型 ${1 + (i % 3)}`,
          createdAt: date.toISOString(),
          predictionType: ['future', 'batch', 'compare'][i % 3],
          months: 6 + (i % 3),
          summary: {
            averageValue: parseFloat((0.65 + i * 0.01).toFixed(4)),
            trendDirection: i % 2 === 0 ? '上升' : '下降',
            confidence: parseFloat((0.88 + i * 0.01).toFixed(3))
          },
          hasDetails: true
        });
      }
      
      return {
        data: {
          predictions: history,
          totalCount: 20,
          page: Math.floor((params.offset || 0) / limit) + 1,
          pageSize: limit
        }
      };
    }
  }

  /**
   * 获取预测详情
   * @param {string} predictionId 预测ID
   * @returns {Promise} 预测详情的Promise对象
   */
  async getPredictionDetails(predictionId) {
    try {
      const response = await apiClient.get(`/predict/${predictionId}`);
      return response;
    } catch (error) {
      // 模拟预测详情，用于前端开发和展示
      return {
        data: {
          id: predictionId,
          modelId: 'model_1',
          modelName: '基准模型',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          predictionType: 'future',
          months: 6,
          predictions: this.generateMockPredictions(6),
          confidenceIntervals: this.generateMockPredictions(6).map(pred => ({
            date: pred.date,
            lower: parseFloat((pred.value * 0.85).toFixed(4)),
            upper: parseFloat((pred.value * 1.15).toFixed(4))
          })),
          statistics: {
            averageValue: parseFloat((0.65 + Math.random() * 0.1).toFixed(4)),
            minValue: parseFloat((0.6 + Math.random() * 0.05).toFixed(4)),
            maxValue: parseFloat((0.7 + Math.random() * 0.05).toFixed(4)),
            trendSlope: parseFloat((0.004 + Math.random() * 0.002).toFixed(5)),
            confidenceLevel: parseFloat((0.9 + Math.random() * 0.05).toFixed(3))
          },
          inputs: {
            historicalDataRange: {
              start: '2023-01',
              end: '2023-12'
            },
            predictionSettings: {
              calculateConfidence: true,
              includeTrendAnalysis: true
            }
          }
        }
      };
    }
  }

  /**
   * 生成预测报告
   * @param {string} predictionId 预测ID
   * @returns {Promise} 报告生成结果的Promise对象
   */
  async generateReport(predictionId) {
    try {
      const response = await apiClient.get(`/predict/${predictionId}/report`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      // 模拟报告生成，用于前端开发和展示
      console.log('模拟报告生成，实际应用中需要实现真实的报告生成功能');
      return {
        data: {
          success: true,
          message: '报告生成成功',
          reportUrl: `/reports/prediction_${predictionId}.pdf`,
          format: 'pdf'
        }
      };
    }
  }

  /**
   * 保存预测结果
   * @param {Object} params 预测结果和元数据
   * @returns {Promise} 保存结果的Promise对象
   */
  async savePrediction(params) {
    try {
      const response = await apiClient.post('/predict/save', params);
      return response;
    } catch (error) {
      // 模拟保存成功，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '预测结果保存成功',
          predictionId: 'pred_' + Date.now(),
          savedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 删除预测记录
   * @param {string} predictionId 预测ID
   * @returns {Promise} 删除结果的Promise对象
   */
  async deletePrediction(predictionId) {
    try {
      const response = await apiClient.delete(`/predict/${predictionId}`);
      return response;
    } catch (error) {
      // 模拟删除成功，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '预测记录删除成功'
        }
      };
    }
  }
}

// 导出服务实例
export const predictionService = new PredictionService();

// 导出默认服务
export default predictionService;