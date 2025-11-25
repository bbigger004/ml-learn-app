# 小区y值预测系统

基于机器学习的社区y值预测Web应用程序，使用NestJS后端和Vue3前端构建。

## 项目概述

本项目是一个完整的机器学习预测系统，专门用于小区y值的预测分析。系统支持从数据上传到预测结果可视化的全流程操作。

### 主要功能

- **数据管理**: CSV文件上传、数据预览、数据预处理
- **特征工程**: 特征选择、特征统计、数据清洗
- **模型训练**: 机器学习模型训练、参数调优、模型评估
- **预测分析**: 未来6个月预测、置信区间计算、结果可视化
- **结果展示**: 交互式图表、数据表格、关键指标统计

### 技术栈

#### 后端技术
- **框架**: NestJS + TypeScript
- **机器学习**: TensorFlow.js
- **数据处理**: CSV解析、特征工程
- **API文档**: Swagger/OpenAPI
- **文件处理**: Multer

#### 前端技术
- **框架**: Vue3 + TypeScript
- **UI组件**: Element Plus
- **图表**: ECharts
- **状态管理**: Pinia
- **路由**: Vue Router

## 快速开始

### 环境要求
- Node.js 16.0+
- npm 或 yarn

### 安装和运行

1. **后端启动**
```bash
cd 后端实现代码
npm install
npm run start:dev
```

2. **前端启动**
```bash
cd 前端实现代码
npm install
npm run dev
```

3. **访问系统**
- 前端: http://localhost:5173
- 后端API文档: http://localhost:3000/api/docs

详细部署说明请参考 [部署和运行说明.md](./部署和运行说明.md)

## 系统架构

### 后端架构
```
后端实现代码/
├── src/
│   ├── modules/
│   │   ├── data/          # 数据管理模块
│   │   ├── model/         # 模型训练模块
│   │   └── prediction/    # 预测模块
│   ├── common/            # 通用组件
│   └── main.ts           # 应用入口
├── uploads/              # 上传文件存储
├── models/               # 模型文件存储
└── package.json
```

### 前端架构
```
前端实现代码/
├── src/
│   ├── components/       # 可复用组件
│   ├── views/           # 页面组件
│   ├── services/        # API服务
│   ├── router/          # 路由配置
│   └── main.ts         # 应用入口
└── package.json
```

## API接口

### 数据管理接口
- `POST /api/data/upload` - 上传CSV文件
- `GET /api/data/preview` - 获取数据预览
- `GET /api/data/columns` - 获取列信息
- `POST /api/data/preprocess` - 数据预处理

### 模型训练接口
- `POST /api/model/train` - 训练模型
- `GET /api/model/evaluation/:id` - 获取模型评估
- `GET /api/model/list` - 获取模型列表
- `POST /api/model/retrain/:id` - 重新训练模型

### 预测接口
- `POST /api/prediction/predict` - 进行预测
- `POST /api/prediction/batch-predict` - 批量预测
- `POST /api/prediction/confidence-interval` - 计算置信区间

完整API文档请访问: http://localhost:3000/api/docs

## 数据格式

### 输入数据格式
系统支持标准的CSV格式，包含以下字段：
- `年月` (时间标识)
- `小区ID` (标识符)
- `y` (目标变量)
- `小区年限`、`是否老旧小区`、`是否增长停滞`
- `饱和度`、`变压器容量`、`变压器数量`
- `用户数量`、`均价`、`建成年份`
- `小区类型` (分类变量)

### 数据预处理
系统自动执行以下预处理步骤：
- 缺失值处理
- 异常值检测
- 特征标准化
- 分类变量编码

## 机器学习模型

### 算法选择
系统使用神经网络模型进行预测，具有以下特点：
- 多层感知器架构
- 支持非线性关系建模
- 自动特征重要性分析
- 可配置的超参数

### 评估指标
- **MSE** (均方误差)
- **RMSE** (均方根误差)
- **MAE** (平均绝对误差)
- **R²** (决定系数)

## 使用流程

1. **数据上传** → 上传CSV数据文件
2. **特征选择** → 选择目标变量和特征列
3. **模型训练** → 配置参数并训练模型
4. **预测分析** → 生成预测结果和可视化

## 开发指南

### 添加新特征
1. 在后端 `data.service.ts` 中添加特征处理逻辑
2. 在前端 `FeatureSelection.vue` 中添加特征选项
3. 更新相关API接口

### 自定义算法
1. 在后端 `model.service.ts` 中实现新算法
2. 在前端训练配置中添加算法参数
3. 更新模型评估逻辑

### 扩展可视化
1. 在前端 `Prediction.vue` 中添加新的图表类型
2. 实现自定义的数据格式化
3. 添加交互功能

## 性能优化

### 后端优化
- 大数据集分批处理
- 模型缓存机制
- 异步处理长时间操作

### 前端优化
- 数据分页显示
- 图表数据采样
- 请求缓存策略

## 安全考虑

- 文件上传类型和大小验证
- CORS跨域配置
- 生产环境建议添加身份验证
- 敏感数据脱敏处理

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请联系开发团队。

---

**注意**: 本系统为演示版本，生产环境部署前请进行充分测试。