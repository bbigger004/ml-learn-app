import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// API接口定义
export default {
  // 数据相关API
  uploadFile: (formData: FormData) => api.post('/data/upload', formData),
  getDataPreview: () => api.get('/data/preview'),
  getColumns: () => api.get('/data/columns'),
  preprocessData: (data: any) => api.post('/data/preprocess', data),

  // 模型相关API
  trainModel: (data: any) => api.post('/model/train', data),
  getModelEvaluation: (modelId: string) => api.get(`/model/evaluation/${modelId}`),
  getModelList: () => api.get('/model/list'),
  retrainModel: (modelId: string, data: any) => api.post(`/model/retrain/${modelId}`, data),

  // 预测相关API
  predict: (data: any) => api.post('/prediction/predict', data),
  batchPredict: (data: any) => api.post('/prediction/batch-predict', data),
  calculateConfidenceInterval: (data: any) => api.post('/prediction/confidence-interval', data)
}