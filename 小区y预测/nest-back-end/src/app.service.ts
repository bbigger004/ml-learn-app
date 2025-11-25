import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '小区y预测系统后端服务';
  }

  getApiInfo(): any {
    return {
      name: '小区y预测系统 API',
      version: '1.0.0',
      description: '基于机器学习的小区y值预测系统后端服务',
      endpoints: {
        data: {
          upload: 'POST /data/upload - 上传CSV数据文件',
          sample: 'GET /data/sample - 获取示例数据',
          preprocess: 'POST /data/preprocess - 预处理数据',
        },
        model: {
          train: 'POST /model/train - 训练模型',
          evaluate: 'GET /model/evaluate - 评估模型',
          list: 'GET /model/list - 获取模型列表',
          delete: 'DELETE /model/:modelId - 删除模型',
          info: 'GET /model/info/:modelId - 获取模型信息',
        },
        prediction: {
          future: 'POST /prediction/future - 预测未来值',
          batch: 'POST /prediction/batch - 批量预测',
          sample: 'GET /prediction/sample - 基于样本数据预测',
          compare: 'GET /prediction/compare - 比较多个模型',
        },
      },
      status: '运行中',
    };
  }

  getHealthStatus(): any {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: '小区y预测系统',
    };
  }
}
