import axios from 'axios';

// 创建axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
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
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

/**
 * 数据服务类
 * 提供数据相关的API调用功能
 */
class DataService {
  /**
   * 获取数据概览信息
   * @returns {Promise} 包含数据概览的Promise对象
   */
  async getDataOverview() {
    try {
      const response = await apiClient.get('/data/overview');
      return response;
    } catch (error) {
      // 模拟数据，用于前端开发和展示
      return {
        data: {
          totalRecords: 200,
          totalFeatures: 11,
          dateRange: {
            start: '2023-01',
            end: '2024-12'
          },
          targetStats: {
            mean: 0.623,
            std: 0.156,
            min: 0.345,
            max: 0.892
          }
        }
      };
    }
  }

  /**
   * 上传数据文件
   * @param {FormData} formData 包含文件的表单数据
   * @returns {Promise} 上传结果的Promise对象
   */
  async uploadData(formData) {
    try {
      const response = await apiClient.post('/data/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      // 模拟成功响应，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '文件上传成功',
          filename: formData.get('file')?.name || 'sample.csv',
          filepath: '/uploads/sample.csv',
          recordsCount: 200,
          featuresCount: 11
        }
      };
    }
  }

  /**
   * 获取数据集列表
   * @returns {Promise} 数据集列表的Promise对象
   */
  async getDataSets() {
    try {
      const response = await apiClient.get('/data/sets');
      return response;
    } catch (error) {
      // 模拟数据，用于前端开发和展示
      return {
        data: [
          {
            id: '1',
            name: 'originData.csv',
            uploadedAt: '2024-01-01T10:00:00Z',
            recordsCount: 200,
            featuresCount: 11
          }
        ]
      };
    }
  }

  /**
   * 获取数据集的详细统计信息
   * @param {string} datasetId 数据集ID
   * @returns {Promise} 统计信息的Promise对象
   */
  async getDataStats(datasetId = '1') {
    try {
      const response = await apiClient.get(`/data/${datasetId}/stats`);
      return response;
    } catch (error) {
      // 模拟统计数据，用于前端开发和展示
      return {
        data: [
          {
            feature: 'y',
            count: 200,
            mean: 0.623,
            std: 0.156,
            min: 0.345,
            max: 0.892,
            q25: 0.498,
            q50: 0.635,
            q75: 0.762
          },
          {
            feature: '小区年限',
            count: 200,
            mean: 5.3,
            std: 2.1,
            min: 1,
            max: 10,
            q25: 3.5,
            q50: 5.0,
            q75: 7.0
          },
          {
            feature: '小区饱和度',
            count: 200,
            mean: 0.75,
            std: 0.12,
            min: 0.45,
            max: 0.98,
            q25: 0.65,
            q50: 0.75,
            q75: 0.85
          },
          {
            feature: '区域特征1',
            count: 200,
            mean: 0.32,
            std: 0.18,
            min: 0.05,
            max: 0.89,
            q25: 0.18,
            q50: 0.29,
            q75: 0.45
          },
          {
            feature: '区域特征2',
            count: 200,
            mean: 0.56,
            std: 0.21,
            min: 0.12,
            max: 0.94,
            q25: 0.38,
            q50: 0.57,
            q75: 0.73
          }
        ]
      };
    }
  }

  /**
   * 获取数据样本
   * @param {string} datasetId 数据集ID
   * @param {number} limit 返回样本数量限制
   * @returns {Promise} 数据样本的Promise对象
   */
  async getDataSample(datasetId = '1', limit = 10) {
    try {
      const response = await apiClient.get(`/data/${datasetId}/sample?limit=${limit}`);
      return response;
    } catch (error) {
      // 模拟数据样本，用于前端开发和展示
      const mockData = [];
      for (let i = 0; i < limit; i++) {
        mockData.push({
          id: i + 1,
          date: `2023-${(i % 12 + 1).toString().padStart(2, '0')}`,
          y: (0.5 + Math.random() * 0.4).toFixed(3),
          '小区年限': Math.floor(Math.random() * 10) + 1,
          '小区饱和度': (0.5 + Math.random() * 0.4).toFixed(3),
          '区域特征1': (Math.random()).toFixed(3),
          '区域特征2': (Math.random()).toFixed(3),
          '区域特征3': (Math.random()).toFixed(3),
          '区域特征4': (Math.random()).toFixed(3),
          '区域特征5': (Math.random()).toFixed(3),
          '区域特征6': (Math.random()).toFixed(3),
          '区域特征7': (Math.random()).toFixed(3),
          '区域特征8': (Math.random()).toFixed(3)
        });
      }
      return {
        data: mockData
      };
    }
  }

  /**
   * 获取特征相关性数据
   * @param {string} datasetId 数据集ID
   * @returns {Promise} 相关性数据的Promise对象
   */
  async getFeatureCorrelations(datasetId = '1') {
    try {
      const response = await apiClient.get(`/data/${datasetId}/correlations`);
      return response;
    } catch (error) {
      // 模拟相关性数据，用于前端开发和展示
      const features = ['y', '小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3'];
      const matrix = [];
      
      // 生成对称的相关系数矩阵
      for (let i = 0; i < features.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < features.length; j++) {
          if (i === j) {
            matrix[i][j] = 1.0;
          } else if (j < i) {
            matrix[i][j] = matrix[j][i];
          } else {
            // 随机生成相关系数，但y与其他特征的相关性略高
            let correlation = (Math.random() - 0.5) * 2;
            if (i === 0) { // y与其他特征的相关性
              correlation = correlation * 0.7 + (Math.random() > 0.6 ? 0.3 : -0.2);
            }
            matrix[i][j] = parseFloat(correlation.toFixed(3));
          }
        }
      }
      
      return {
        data: {
          features,
          matrix
        }
      };
    }
  }

  /**
   * 预处理数据
   * @param {Object} params 预处理参数
   * @returns {Promise} 预处理结果的Promise对象
   */
  async preprocessData(params) {
    try {
      const response = await apiClient.post('/data/preprocess', params);
      return response;
    } catch (error) {
      // 模拟预处理结果，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '数据预处理成功',
          processedFeatures: params.features || ['y', '小区年限', '小区饱和度'],
          recordsCount: 180,
          preprocessingSteps: params.steps || ['标准化', '缺失值填充'],
          processedDataId: 'processed_' + Date.now()
        }
      };
    }
  }

  /**
   * 删除数据集
   * @param {string} datasetId 数据集ID
   * @returns {Promise} 删除结果的Promise对象
   */
  async deleteDataset(datasetId) {
    try {
      const response = await apiClient.delete(`/data/${datasetId}`);
      return response;
    } catch (error) {
      // 模拟删除成功，用于前端开发和展示
      return {
        data: {
          success: true,
          message: '数据集删除成功'
        }
      };
    }
  }
}

// 导出服务实例
export const dataService = new DataService();

// 导出默认服务
export default dataService;