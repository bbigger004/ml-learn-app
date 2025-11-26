import { Controller, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PredictionService } from './prediction.service';

interface PredictDto {
  modelId: string;
  periods: number;
}

@ApiTags('prediction')
@Controller('api/prediction')
export class PredictionController {
  constructor(private readonly predictionService: PredictionService) {}

  @Post('predict')
  @ApiOperation({ summary: '进行未来预测' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        modelId: {
          type: 'string',
          description: '模型ID',
        },
        periods: {
          type: 'number',
          description: '预测期数',
          default: 6,
        },
      },
    },
  })
  async predict(@Body() predictDto: PredictDto) {
    return this.predictionService.predict(predictDto.modelId, predictDto.periods);
  }

  @Post('batch-predict')
  @ApiOperation({ summary: '批量预测' })
  async batchPredict(@Body() body: { modelId: string; inputData: any[] }) {
    return this.predictionService.batchPredict(body.modelId, body.inputData);
  }

  @Post('confidence-interval')
  @ApiOperation({ summary: '计算预测置信区间' })
  async calculateConfidenceInterval(@Body() body: { modelId: string; periods: number }) {
    return this.predictionService.calculateConfidenceInterval(body.modelId, body.periods);
  }
}