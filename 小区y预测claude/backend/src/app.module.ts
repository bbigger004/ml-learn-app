import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from './modules/data/data.module';
import { ModelModule } from './modules/model/model.module';
import { PredictionModule } from './modules/prediction/prediction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DataModule,
    ModelModule,
    PredictionModule,
  ],
})
export class AppModule {}