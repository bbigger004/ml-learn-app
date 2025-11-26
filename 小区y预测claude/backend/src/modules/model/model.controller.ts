import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ModelService } from './model.service';

interface TrainModelDto {
  selectedFeatures: string[];
  targetColumn: string;
  testSize?: number;
  modelParams?: {
    n_estimators?: number;
    max_depth?: number;
    learning_rate?: number;
  };
}

@ApiTags('model')
@Controller('api/model')
export class ModelController {
  constructor(private readonly modelService: ModelService) {}

  @Post('train')
  @ApiOperation({ summary: '训练预测模型' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        selectedFeatures: {
          type: 'array',
          items: { type: 'string' },
          description: '选择的特征列',
        },
        targetColumn: {
          type: 'string',
          description: '目标列',
        },
        testSize: {
          type: 'number',
          description: '测试集比例',
          default: 0.2,
        },
        modelParams: {
          type: 'object',
          description: '模型参数',
          properties: {
            n_estimators: { type: 'number', default: 100 },
            max_depth: { type: 'number', default: 6 },
            learning_rate: { type: 'number', default: 0.1 },
          },
        },
      },
    },
  })
  async trainModel(@Body() trainModelDto: TrainModelDto) {
    return this.modelService.trainModel(trainModelDto);
  }

  @Get('evaluation/:modelId')
  @ApiOperation({ summary: '获取模型评估结果' })
  async getModelEvaluation(@Param('modelId') modelId: string) {
    return this.modelService.getModelEvaluation(modelId);
  }

  @Get('list')
  @ApiOperation({ summary: '获取已训练的模型列表' })
  async getModelList() {
    return this.modelService.getModelList();
  }

  @Post('retrain/:modelId')
  @ApiOperation({ summary: '重新训练指定模型' })
  async retrainModel(
    @Param('modelId') modelId: string,
    @Body() trainModelDto: TrainModelDto,
  ) {
    return this.modelService.retrainModel(modelId, trainModelDto);
  }
}