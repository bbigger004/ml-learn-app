import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { DataService } from '../data/data.service';

@Controller('prediction')
export class PredictionController {
  constructor(
    private readonly predictionService: PredictionService,
    private readonly dataService: DataService
  ) {}

  @Post('future')
  async predictFuture(@Body() predictionRequest: any) {
    try {
      // 验证请求参数
      if (!predictionRequest.modelId) {
        throw new Error('模型ID不能为空');
      }
      if (!predictionRequest.features || !Array.isArray(predictionRequest.features)) {
        throw new Error('特征列表不能为空');
      }
      if (!predictionRequest.target) {
        throw new Error('目标变量不能为空');
      }
      
      // 获取历史数据
      let historicalData;
      if (predictionRequest.useSampleData) {
        // 使用示例数据
        historicalData = await this.dataService.getSampleData();
      } else if (predictionRequest.historicalData) {
        // 使用提供的历史数据
        historicalData = predictionRequest.historicalData;
      } else if (predictionRequest.dataId) {
        // 这里应该从数据库或缓存中获取数据
        historicalData = await this.dataService.getSampleData();
      } else {
        throw new Error('请提供历史数据');
      }
      
      // 预处理数据
      const preprocessedData = this.dataService.preprocessData(historicalData);
      
      // 如果指定了小区ID，则筛选特定小区的数据
      let filteredData = preprocessedData;
      if (predictionRequest.communityId) {
        filteredData = preprocessedData.filter(item => 
          item['小区ID'] === predictionRequest.communityId
        );
        if (filteredData.length === 0) {
          throw new Error(`未找到小区ID为${predictionRequest.communityId}的数据`);
        }
      }
      
      // 执行预测
      const result = await this.predictionService.predictFuture(
        predictionRequest.modelId,
        filteredData,
        predictionRequest.features,
        predictionRequest.target,
        predictionRequest.lookback || 6,
        predictionRequest.months || 6
      );
      
      return {
        message: '预测成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('batch')
  async batchPredict(@Body() batchRequest: any) {
    try {
      // 验证请求参数
      if (!batchRequest.modelId) {
        throw new Error('模型ID不能为空');
      }
      if (!batchRequest.requests || !Array.isArray(batchRequest.requests)) {
        throw new Error('请求列表不能为空');
      }
      if (!batchRequest.features || !Array.isArray(batchRequest.features)) {
        throw new Error('特征列表不能为空');
      }
      if (!batchRequest.target) {
        throw new Error('目标变量不能为空');
      }
      
      // 执行批量预测
      const results = await this.predictionService.batchPredict(
        batchRequest.modelId,
        batchRequest.requests,
        batchRequest.features,
        batchRequest.target,
        batchRequest.lookback || 6
      );
      
      return {
        message: '批量预测成功',
        results,
        totalRequests: results.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: '批量预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sample')
  async predictFromSampleData(
    @Query('modelId') modelId: string,
    @Query('features') featuresStr: string,
    @Query('target') target: string,
    @Query('months') monthsStr: string
  ) {
    try {
      // 验证参数
      if (!modelId) {
        throw new Error('模型ID不能为空');
      }
      
      const features = featuresStr.split(',');
      if (!features || features.length === 0) {
        throw new Error('特征列表不能为空');
      }
      
      if (!target) {
        throw new Error('目标变量不能为空');
      }
      
      const months = monthsStr ? parseInt(monthsStr, 10) : 6;
      
      // 执行预测
      const result = await this.predictionService.predictFromSampleData(
        modelId,
        features,
        target,
        months
      );
      
      return {
        message: '基于样本数据预测成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('compare')
  async compareModels(
    @Query('modelIds') modelIdsStr: string,
    @Query('features') featuresStr: string,
    @Query('target') target: string,
    @Query('communityId') communityId?: string
  ) {
    try {
      const modelIds = modelIdsStr.split(',');
      const features = featuresStr.split(',');
      
      if (!modelIds || modelIds.length === 0) {
        throw new Error('模型ID列表不能为空');
      }
      
      if (!features || features.length === 0) {
        throw new Error('特征列表不能为空');
      }
      
      if (!target) {
        throw new Error('目标变量不能为空');
      }
      
      // 获取历史数据
      const historicalData = await this.dataService.getSampleData();
      const preprocessedData = this.dataService.preprocessData(historicalData);
      
      // 筛选特定小区的数据
      let filteredData = preprocessedData;
      if (communityId) {
        filteredData = preprocessedData.filter(item => 
          item['小区ID'] === communityId
        );
      }
      
      // 对每个模型进行预测
      const comparisonResults = {};
      
      for (const modelId of modelIds) {
        const prediction = await this.predictionService.predictFuture(
          modelId,
          filteredData,
          features,
          target
        );
        
        comparisonResults[modelId] = prediction;
      }
      
      return {
        message: '模型比较完成',
        comparisons: comparisonResults,
        communityId: communityId || 'all',
      };
    } catch (error) {
      throw new HttpException(
        { message: '模型比较失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}