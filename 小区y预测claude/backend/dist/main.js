"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176'],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('小区y值预测系统API')
        .setDescription('基于机器学习的社区y值预测系统后端API')
        .setVersion('1.0')
        .addTag('data', '数据管理相关接口')
        .addTag('model', '模型训练相关接口')
        .addTag('prediction', '预测相关接口')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    await app.listen(3000);
    console.log('🚀 后端服务已启动: http://localhost:3000');
    console.log('📚 API文档: http://localhost:3000/api/docs');
}
bootstrap();
//# sourceMappingURL=main.js.map