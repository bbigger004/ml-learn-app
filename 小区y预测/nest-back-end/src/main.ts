import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ensureDirectoryExists } from './common/utils/file.utils';
import * as path from 'path';

async function bootstrap() {
  // 创建必要的目录
  const uploadsDir = path.join(__dirname, '../uploads');
  const modelsDir = path.join(__dirname, '../models');
  ensureDirectoryExists(uploadsDir);
  ensureDirectoryExists(modelsDir);

  const app = await NestFactory.create(AppModule);
  
  // 启用CORS
  app.enableCors({
    origin: '*', // 在生产环境中应该设置为具体的前端域名
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Origin,X-Requested-With,Content-Type,Accept,Authorization',
  });
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // 设置全局前缀
  app.setGlobalPrefix('api');
  
  // 启动服务器
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`小区y预测系统后端服务已启动，监听端口: ${port}`);
  console.log(`API文档地址: http://localhost:${port}/api`);
  console.log(`健康检查地址: http://localhost:${port}/api/health`);
}
bootstrap();
