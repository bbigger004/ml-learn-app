import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // 全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger文档配置
  const config = new DocumentBuilder()
    .setTitle('小区y值预测系统API')
    .setDescription('基于机器学习的社区y值预测系统后端API')
    .setVersion('1.0')
    .addTag('data', '数据管理相关接口')
    .addTag('model', '模型训练相关接口')
    .addTag('prediction', '预测相关接口')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
  console.log('🚀 后端服务已启动: http://localhost:3000');
  console.log('📚 API文档: http://localhost:3000/api/docs');
}

bootstrap();