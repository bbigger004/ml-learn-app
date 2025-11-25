# 小区y值预测系统设计方案

## 1. 系统架构设计

### 1.1 技术栈
- **后端**: NestJS + TypeScript + TensorFlow.js + Multer
- **前端**: Vue3 + TypeScript + Element Plus + ECharts
- **数据库**: 文件系统存储（CSV文件）
- **机器学习**: TensorFlow.js (回归模型)

### 1.2 系统架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端Vue3      │    │   NestJS后端    │    │   数据存储      │
│                 │    │                 │    │                 │
│ - 文件上传组件  │◄──►│ - 文件上传API   │◄──►│ - CSV文件       │
│ - 特征选择组件  │    │ - 数据预处理API │    │ - 模型文件      │
│ - 模型训练界面  │    │ - 模型训练API   │    │ - 预测结果      │
│ - 结果可视化    │    │ - 预测API       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.3 模块划分
- **数据管理模块**: 文件上传、数据读取、数据预处理
- **模型训练模块**: 特征工程、模型训练、超参数调优
- **预测模块**: 未来预测、结果生成
- **可视化模块**: 图表展示、结果分析

## 2. 数据预处理方案

### 2.1 数据特征分析
基于数据集分析，包含以下特征：
- 时间特征: 年月
- 小区标识: 小区ID
- 目标变量: y值
- 小区属性: 小区年限、是否老旧小区、是否增长停滞、饱和度
- 电力特征: 变压器容量、变压器数量、用户数量
- 价格特征: 均价
- 建筑特征: 建成年份
- 分类特征: 小区类型

### 2.2 数据清洗步骤
1. **缺失值处理**: 数值型特征使用中位数填充，分类特征使用众数填充
2. **异常值检测**: 使用IQR方法检测并处理异常值
3. **时间特征提取**: 从年月字段提取年、月、季度特征
4. **特征编码**: 对分类变量进行独热编码
5. **特征标准化**: 对数值型特征进行标准化处理

### 2.3 特征工程
- 创建时间序列特征：滞后特征、滑动窗口统计
- 小区特征交叉：年限与类型的交互特征
- 电力负载特征：变压器容量/用户数量

## 3. 机器学习算法选型

### 3.1 算法对比分析

#### 3.1.1 线性回归 + 时间序列特征
- **优点**: 简单、可解释性强、训练速度快
- **缺点**: 对非线性关系捕捉能力有限
- **适用场景**: 数据量较小，关系相对线性

#### 3.1.2 随机森林回归
- **优点**: 处理非线性关系、抗过拟合、特征重要性分析
- **缺点**: 对时间序列模式捕捉有限
- **适用场景**: 特征间存在复杂交互关系

#### 3.1.3 XGBoost回归
- **优点**: 预测精度高、处理缺失值、并行计算
- **缺点**: 参数调优复杂、可解释性较差
- **适用场景**: 对预测精度要求高

### 3.2 推荐算法
**推荐使用XGBoost回归**，原因：
- 数据集包含多种类型特征，XGBoost能有效处理
- 需要较高的预测精度
- 支持特征重要性分析，便于业务理解

## 4. 后端API接口设计

### 4.1 接口概览
```typescript
// 文件上传接口
POST /api/upload

// 数据预览接口
GET /api/data/preview

// 特征选择接口
POST /api/features/select

// 模型训练接口
POST /api/model/train

// 预测接口
POST /api/predict

// 模型评估接口
GET /api/model/evaluation
```

### 4.2 核心接口详细设计

#### 4.2.1 文件上传接口
```typescript
// 请求
POST /api/upload
Content-Type: multipart/form-data

// 响应
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "filename": "originData.csv",
    "rowCount": 1000,
    "columns": ["年月", "小区ID", "y", ...]
  }
}
```

#### 4.2.2 模型训练接口
```typescript
// 请求
POST /api/model/train
{
  "selectedFeatures": ["小区年限", "饱和度", "用户数量", ...],
  "targetColumn": "y",
  "testSize": 0.2,
  "modelParams": {
    "n_estimators": 100,
    "max_depth": 6,
    "learning_rate": 0.1
  }
}

// 响应
{
  "success": true,
  "message": "模型训练完成",
  "data": {
    "modelId": "model_123",
    "trainingTime": "15.2s",
    "evaluation": {
      "mse": 2.34,
      "rmse": 1.53,
      "mae": 1.21,
      "r2": 0.89
    },
    "featureImportance": [
      {"feature": "用户数量", "importance": 0.35},
      {"feature": "饱和度", "importance": 0.28},
      ...
    ]
  }
}
```

#### 4.2.3 预测接口
```typescript
// 请求
POST /api/predict
{
  "modelId": "model_123",
  "periods": 6
}

// 响应
{
  "success": true,
  "data": {
    "predictions": [
      {"date": "2025-07", "value": 35.2, "confidence_lower": 32.1, "confidence_upper": 38.3},
      {"date": "2025-08", "value": 36.1, "confidence_lower": 33.0, "confidence_upper": 39.2},
      ...
    ],
    "historicalData": [
      {"date": "2024-01", "value": 19},
      {"date": "2024-02", "value": 19},
      ...
    ]
  }
}
```

## 5. 前端界面设计

### 5.1 页面结构
```
┌─────────────────────────────────────────────────────────────┐
│                   小区y值预测系统                           │
├─────────────────────────────────────────────────────────────┤
│ 导航: [数据上传] [特征选择] [模型训练] [预测结果] [系统设置] │
├─────────────────────────────────────────────────────────────┤
│                          内容区域                           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 核心组件

#### 5.2.1 数据上传组件
- 拖拽上传区域
- 文件格式验证
- 数据预览表格
- 上传进度显示

#### 5.2.2 特征选择组件
- 特征列表（可多选）
- 特征类型标识
- 特征统计信息
- 目标变量选择

#### 5.2.3 模型训练组件
- 训练参数配置
- 实时训练进度
- 训练日志显示
- 模型评估结果

#### 5.2.4 预测结果组件
- 时间序列图表
- 预测区间显示
- 关键指标统计
- 结果导出功能

## 6. 模型训练与评估

### 6.1 训练流程
1. **数据分割**: 按时间顺序分割训练集和测试集
2. **特征工程**: 应用预处理管道
3. **模型训练**: 使用交叉验证调优超参数
4. **模型评估**: 在测试集上评估性能
5. **模型保存**: 保存训练好的模型

### 6.2 评估指标
- **MSE** (均方误差): 衡量预测误差的平方
- **RMSE** (均方根误差): 误差的标准差
- **MAE** (平均绝对误差): 平均绝对误差
- **R²** (决定系数): 模型解释的方差比例

### 6.3 交叉验证策略
使用时间序列交叉验证，确保训练数据在测试数据之前

## 7. 预测结果可视化

### 7.1 图表类型
- **时间序列图**: 展示历史数据与预测趋势
- **置信区间图**: 显示预测的不确定性
- **特征重要性图**: 条形图展示各特征重要性
- **残差图**: 分析模型预测误差

### 7.2 可视化组件实现
使用ECharts库实现交互式图表：
- 支持缩放和平移
- 鼠标悬停显示详细数据
- 图例控制显示/隐藏系列
- 数据点标签显示

## 8. 部署和运行说明

### 8.1 环境要求
- Node.js 16+
- npm 或 yarn

### 8.2 安装步骤
```bash
# 克隆项目
git clone <repository-url>

# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install

# 启动后端服务
cd ../backend
npm run start:dev

# 启动前端服务
cd ../frontend
npm run dev
```

### 8.3 配置文件
创建环境配置文件：
```env
# 后端配置
PORT=3000
UPLOAD_PATH=./uploads
MODEL_PATH=./models

# 前端配置
VITE_API_BASE_URL=http://localhost:3000/api
```

## 9. 代码实现要点

### 9.1 后端核心代码结构
```
backend/
├── src/
│   ├── modules/
│   │   ├── data/
│   │   │   ├── data.controller.ts
│   │   │   ├── data.service.ts
│   │   │   └── data.module.ts
│   │   ├── model/
│   │   │   ├── model.controller.ts
│   │   │   ├── model.service.ts
│   │   │   └── model.module.ts
│   │   └── prediction/
│   │       ├── prediction.controller.ts
│   │       ├── prediction.service.ts
│   │       └── prediction.module.ts
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   └── main.ts
├── uploads/
├── models/
└── package.json
```

### 9.2 前端核心代码结构
```
frontend/
├── src/
│   ├── components/
│   │   ├── FileUpload.vue
│   │   ├── FeatureSelection.vue
│   │   ├── ModelTraining.vue
│   │   └── PredictionChart.vue
│   ├── views/
│   │   ├── Home.vue
│   │   ├── DataUpload.vue
│   │   ├── ModelTraining.vue
│   │   └── Prediction.vue
│   ├── services/
│   │   └── api.ts
│   ├── stores/
│   │   └── app.ts
│   └── main.ts
├── public/
└── package.json
```

这个设计方案提供了一个完整的Web应用程序架构，涵盖了从数据预处理到预测可视化的全流程。系统设计注重实用性和易用性，同时保证了模型的预测精度和可解释性。