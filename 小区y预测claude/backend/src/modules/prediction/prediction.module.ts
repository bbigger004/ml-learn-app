import { Module } from '@nestjs/common';
import { PredictionController } from './prediction.controller';
import { PredictionService } from './prediction.service';
import { ModelModule } from '../model/model.module';
import { DataModule } from '../data/data.module';

@Module({
  imports: [ModelModule, DataModule],
  controllers: [PredictionController],
  providers: [PredictionService],
  exports: [PredictionService],
})
export class PredictionModule {}