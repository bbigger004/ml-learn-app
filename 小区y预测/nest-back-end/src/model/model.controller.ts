import { Controller, Post, Get, Delete, Body, Query, HttpException, HttpStatus, Param } from '@nestjs/common';
import { ModelService } from './model.service';
import { DataService } from '../data/data.service';

@Controller('model')
export class ModelController {
  constructor(
    private readonly modelService: ModelService,
    private readonly dataService: DataService
  ) {}

  @Post('train')
  async trainModel(@Body() trainingRequest: any) {
    try {
      // 验证请求参数
      if (!trainingRequest.features || !Array.isArray(trainingRequest.features)) {
        throw new Error('特征列表不能为空');
      }
      if (!trainingRequest.target) {
        throw new Error('目标变量不能为空');
      }
      
      // 获取和预处理数据
      let data;
      if (trainingRequest.useSampleData) {
        // 使用示例数据
        data = await this.dataService.getSampleData();
      } else if (trainingRequest.dataId) {
        // 这里应该从数据库或缓存中获取上传的数据
        // 目前暂时使用示例数据作为替代
        data = await this.dataService.getSampleData();
      } else {
        throw new Error('请提供数据来源');
      }
      
      // 预处理数据
      const preprocessedData = this.dataService.preprocessData(data);
      
      // 特征选择
      const selectedData = this.dataService.selectFeatures(preprocessedData, [...trainingRequest.features, trainingRequest.target]);
      
      // 拆分数据集
      const { train } = this.dataService.splitData(selectedData, trainingRequest.testRatio || 0.2);
      
      // 训练模型
      const result = await this.modelService.trainModel(
        trainingRequest.modelType || 'lstm',
        train,
        trainingRequest.features,
        trainingRequest.target,
        trainingRequest.config || {}
      );
      
      return {
        message: '模型训练成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '模型训练失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('evaluate')
  async evaluateModel(@Query('modelId') modelId: string, @Query('features') featuresStr: string, @Query('target') target: string, @Query('lookback') lookback?: number) {
    try {
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
      
      // 获取测试数据
      const data = await this.dataService.getSampleData();
      const preprocessedData = this.dataService.preprocessData(data);
      const selectedData = this.dataService.selectFeatures(preprocessedData, [...features, target]);
      const { test } = this.dataService.splitData(selectedData, 0.2);
      
      // 评估模型
      const metrics = await this.modelService.evaluateModel(modelId, test, features, target, lookback);
      
      return {
        message: '模型评估成功',
        modelId,
        metrics,
      };
    } catch (error) {
      throw new HttpException(
        { message: '模型评估失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('list')
  async getModelList() {
    try {
      const models = await this.modelService.getModelList();
      return {
        message: '获取模型列表成功',
        models,
      };
    } catch (error) {
      throw new HttpException(
        { message: '获取模型列表失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':modelId')
  async deleteModel(@Param('modelId') modelId: string) {
    try {
      if (!modelId) {
        throw new Error('模型ID不能为空');
      }
      
      await this.modelService.deleteModel(modelId);
      
      return {
        message: '模型删除成功',
        modelId,
      };
    } catch (error) {
      throw new HttpException(
        { message: '模型删除失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('info/:modelId')
  async getModelInfo(@Param('modelId') modelId: string) {
    try {
      if (!modelId) {
        throw new Error('模型ID不能为空');
      }
      
      // 加载模型获取信息
      const model = await this.modelService.loadModel(modelId);
      
      return {
        message: '获取模型信息成功',
        modelId,
        // 这里可以返回更多模型相关信息，如层数、参数数量等
        summary: 'LSTM模型',
      };
    } catch (error) {
      throw new HttpException(
        { message: '获取模型信息失败', error: error.message },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('predict')
  async predict(@Body() predictRequest: any) {
    try {
      if (!predictRequest.modelId) {
        throw new Error('模型ID不能为空');
      }
      if (!predictRequest.inputData || !Array.isArray(predictRequest.inputData)) {
        throw new Error('输入数据不能为空');
      }

      // 进行预测
      const result = await this.modelService.predict(
        predictRequest.modelId,
        predictRequest.inputData,
        predictRequest.lookback,
        predictRequest.features
      );

      return {
        message: '预测成功',
        result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('batch-predict')
  async batchPredict(@Body() predictRequest: any) {
    try {
      if (!predictRequest.modelId) {
        throw new Error('模型ID不能为空');
      }
      if (!predictRequest.batchData || !Array.isArray(predictRequest.batchData)) {
        throw new Error('批量数据不能为空');
      }

      // 进行批量预测
      const results = await this.modelService.batchPredict(
        predictRequest.modelId,
        predictRequest.batchData
      );

      return {
        message: '批量预测成功',
        results,
      };
    } catch (error) {
      throw new HttpException(
        { message: '批量预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('multi-step-predict')
  async multiStepPredict(@Body() predictRequest: any) {
    try {
      if (!predictRequest.modelId) {
        throw new Error('模型ID不能为空');
      }
      if (!predictRequest.inputData || !Array.isArray(predictRequest.inputData)) {
        throw new Error('输入数据不能为空');
      }
      if (!predictRequest.steps || predictRequest.steps <= 0) {
        throw new Error('预测步数必须大于0');
      }

      // 进行多步预测
      const result = await this.modelService.predictMultiStep(
        predictRequest.modelId,
        predictRequest.inputData,
        predictRequest.features,
        predictRequest.steps,
        predictRequest.lookback
      );

      return {
        message: '多步预测成功',
        result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '多步预测失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('compare-models')
  async compareModels(@Body() compareRequest: any) {
    try {
      if (!compareRequest.modelIds || !Array.isArray(compareRequest.modelIds)) {
        throw new Error('模型ID列表不能为空');
      }
      if (!compareRequest.features || !Array.isArray(compareRequest.features)) {
        throw new Error('特征列表不能为空');
      }
      if (!compareRequest.target) {
        throw new Error('目标变量不能为空');
      }

      // 获取测试数据
      const data = await this.dataService.getSampleData();
      const preprocessedData = this.dataService.preprocessData(data);
      const selectedData = this.dataService.selectFeatures(preprocessedData, [...compareRequest.features, compareRequest.target]);
      const { test } = this.dataService.splitData(selectedData, 0.2);

      // 比较模型
      const comparison = await this.modelService.compareModels(
        compareRequest.modelIds,
        test,
        compareRequest.features,
        compareRequest.target
      );

      return {
        message: '模型比较成功',
        comparison,
      };
    } catch (error) {
      throw new HttpException(
        { message: '模型比较失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('optimize-hyperparams')
  async optimizeHyperparameters(@Body() optimizeRequest: any) {
    try {
      if (!optimizeRequest.features || !Array.isArray(optimizeRequest.features)) {
        throw new Error('特征列表不能为空');
      }
      if (!optimizeRequest.target) {
        throw new Error('目标变量不能为空');
      }
      if (!optimizeRequest.modelType) {
        throw new Error('模型类型不能为空');
      }

      // 获取和预处理数据
      let data;
      if (optimizeRequest.useSampleData) {
        data = await this.dataService.getSampleData();
      } else if (optimizeRequest.dataId) {
        data = await this.dataService.getSampleData(); // 暂时使用示例数据
      } else {
        throw new Error('请提供数据来源');
      }

      // 预处理数据
      const preprocessedData = this.dataService.preprocessData(data);
      const selectedData = this.dataService.selectFeatures(preprocessedData, [...optimizeRequest.features, optimizeRequest.target]);
      const { train } = this.dataService.splitData(selectedData, optimizeRequest.testRatio || 0.2);

      // 超参数优化
      const result = await this.modelService.optimizeHyperparameters(
        optimizeRequest.modelType,
        train,
        optimizeRequest.features,
        optimizeRequest.target,
        optimizeRequest.paramSpace || {}
      );

      return {
        message: '超参数优化成功',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        { message: '超参数优化失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}