import { Module } from '@nestjs/common';
import { PredictionService } from './prediction.service';
import { PredictionController } from './prediction.controller';
import { ModelModule } from '../model/model.module';
import { DataModule } from '../data/data.module';

@Module({
  imports: [ModelModule, DataModule],
  providers: [PredictionService],
  controllers: [PredictionController],
  exports: [PredictionService],
})
export class PredictionModule {}