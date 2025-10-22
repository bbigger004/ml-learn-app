# 敏感人群动态保电 - 投诉风险预测系统

基于Python和LightGBM的机器学习项目，用于预测电网敏感人群区域的投诉风险。

## 项目结构

```
ml-py-app/
├── src/                    # 源代码目录
│   ├── data/              # 数据处理模块
│   ├── models/            # 模型实现模块
│   ├── utils/             # 工具函数模块
│   └── visualizations/    # 可视化模块
├── data/                  # 数据目录
│   ├── raw/               # 原始数据
│   └── processed/         # 处理后的数据
├── models/                # 模型存储目录
├── notebooks/             # Jupyter笔记本
├── tests/                 # 测试代码
├── config/                # 配置文件
├── logs/                  # 日志文件
├── figures/               # 图表输出
├── example_usage.py       # 使用示例脚本
├── requirements.txt       # 依赖包列表
├── setup.py               # 包安装配置
└── README.md              # 项目说明文档
```

## 功能特性

- **数据生成与处理**：支持样本数据生成、数据清洗、特征工程等功能
- **LightGBM模型**：基于梯度提升树算法的高效分类模型
- **完整评估指标**：包含准确率、精确率、召回率、F1值、ROC-AUC等多种评估指标
- **可视化分析**：提供特征重要性分析、ROC曲线、混淆矩阵等可视化功能
- **模型管理**：支持模型的保存、加载和参数调优

## 安装与配置

### 环境要求

- Python 3.9+
- 推荐使用虚拟环境（如conda或venv）

### 安装依赖

```bash
# 克隆项目后进入目录
cd ml-py-app

# 安装依赖包
pip install -r requirements.txt

# 或安装为可编辑模式（开发时使用）
pip install -e .
```

## 使用示例

### 1. 快速开始

运行示例脚本来体验完整的工作流程：

```bash
python example_usage.py
```

该脚本将：
- 生成样本数据
- 训练LightGBM模型
- 评估模型性能
- 显示预测结果

### 2. 在Python代码中使用

```python
from src.data.data_processor import PowerGridDataProcessor
from src.models.lgbm_model import LightGBMComplaintPredictor

# 1. 数据处理
data_processor = PowerGridDataProcessor()

# 生成样本数据（或加载真实数据）
data = data_processor.generate_sample_data(n_samples=1000)

# 预处理特征
X = data_processor.preprocess_features(data)
y = data['complaint_label'].values

# 划分数据集
X_train, X_test, y_train, y_test = data_processor.split_data(X, y)

# 2. 模型训练
model = LightGBMComplaintPredictor()
model.train(X_train, y_train, X_test, y_test)

# 3. 模型评估
metrics = model.evaluate(X_test, y_test)

# 4. 进行预测
probabilities, classes = model.predict(X_test)

# 5. 保存模型
model.save_model('models/complaint_predictor.joblib')
```

### 3. 数据字段说明

系统处理的特征包括：

| 特征名称 | 描述 | 取值范围 |
|---------|------|--------|
| 人口密度 | 区域人口密度 | 0-1（归一化） |
| 负载率 | 电网负载率 | 0-1（归一化） |
| 历史故障数 | 历史故障数量 | 0-1（归一化） |
| 特殊群体密度 | 敏感人群密度 | 0-1（归一化） |
| 设备老化程度 | 设备老化评估值 | 0-1（归一化） |
| 外部风险 | 外部环境风险 | 0-1（归一化） |
| 是否节假日 | 是否为节假日 | 0-1（二元） |
| 经济水平 | 区域经济发展水平 | 0-1（归一化） |
| 历史投诉数 | 历史投诉记录数 | 0-1（归一化） |
| 温度 | 当前温度 | 0-1（归一化） |

## 模型参数说明

LightGBM模型的主要参数：

```python
params = {
    'objective': 'binary',          # 二分类任务
    'metric': 'binary_logloss',     # 评价指标
    'num_leaves': 31,               # 叶子节点数
    'max_depth': 8,                 # 最大深度
    'learning_rate': 0.05,          # 学习率
    'n_estimators': 200,            # 树的数量
    'subsample': 0.8,               # 行采样比例
    'colsample_bytree': 0.8,        # 列采样比例
    'random_state': 42,             # 随机种子
    'n_jobs': -1                    # 使用所有CPU核心
}
```

## 开发与扩展

### 添加新的模型

在`src/models/`目录下创建新的模型类，继承或参考现有的模型实现。

### 扩展数据处理功能

在`src/data/`目录下扩展数据处理器的功能，添加新的数据处理方法。

## 注意事项

1. 本项目提供的样本数据生成器仅用于演示，实际应用中应使用真实数据
2. 对于大规模数据，可能需要调整模型参数以获得更好的性能
3. 建议在使用前对模型进行交叉验证和参数调优

## 许可证

本项目使用MIT许可证。

## 联系信息

如有问题或建议，请提交Issue或Pull Request。