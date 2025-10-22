学习路径规划
阶段1：基础数学和数据处理
阶段2：TensorFlow.js 基础
阶段3：构建第一个预测模型
阶段4：完整项目实战
阶段1：基础数学和数据处理
1.1 安装环境
```bash
# 创建新项目
mkdir ml-web-app
cd ml-web-app
npm init -y

# 安装依赖
npm install @tensorflow/tfjs-node
npm install express
npm install csv-parser
npm install nodemon --save-dev
```
1.2 基础数据处理示例
```javascript
// 1-data-basics.js
const tf = require('@tensorflow/tfjs-node');

// 1. 创建张量 - 深度学习的基本数据结构
function tensorBasics() {
  // 创建一维张量 (向量)
  const vector = tf.tensor1d([1, 2, 3, 4, 5]);
  console.log('Vector:', vector.toString());
  console.log('Shape:', vector.shape); // [5]
  console.log('Data type:', vector.dtype);

  // 创建二维张量 (矩阵)
  const matrix = tf.tensor2d([[1, 2], [3, 4], [5, 6]]);
  console.log('\nMatrix:', matrix.toString());
  console.log('Shape:', matrix.shape); // [3, 2]

  // 张量运算 - 类似numpy
  const a = tf.tensor1d([1, 2, 3]);
  const b = tf.tensor1d([4, 5, 6]);
  
  const add = a.add(b);        // 加法 [5,7,9]
  const multiply = a.mul(b);   // 乘法 [4,10,18]
  const dotProduct = a.dot(b); // 点积 32
  
  console.log('\nAddition:', add.toString());
  console.log('Multiplication:', multiply.toString());
  console.log('Dot product:', dotProduct.toString());
}

// 2. 数据标准化 - 机器学习重要预处理步骤
function dataNormalization() {
  // 原始数据
  const originalData = [100, 200, 300, 400, 500];
  const tensor = tf.tensor1d(originalData);
  
  // 最小-最大标准化 (缩放到 0-1)
  const min = tensor.min();
  const max = tensor.max();
  const normalized = tensor.sub(min).div(max.sub(min));
  
  console.log('\n--- Data Normalization ---');
  console.log('Original:', originalData);
  console.log('Min:', min.dataSync()[0]);
  console.log('Max:', max.dataSync()[0]);
  console.log('Normalized:', normalized.dataSync());
  
  return { tensor, normalized, min, max };
}

// 运行示例
tensorBasics();
dataNormalization();
```
运行命令：

```bash
node 1-data-basics.js
```
阶段2：TensorFlow.js 基础
2.1 线性回归示例

```javascript
// 2-linear-regression.js
const tf = require('@tensorflow/tfjs-node');

async function linearRegression() {
  // 生成模拟数据: y = 2x + 1 + 噪声
  const xs = tf.tensor1d([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const ys = tf.tensor1d([3.1, 4.8, 6.9, 9.2, 11.1, 13.2, 14.8, 17.1, 19.3, 21.2]);

  // 创建简单的线性回归模型
  const model = tf.sequential();
  model.add(tf.layers.dense({
    units: 1,          // 输出维度
    inputShape: [1],   // 输入维度
  }));

  // 编译模型
  model.compile({
    optimizer: tf.train.sgd(0.01), // 随机梯度下降，学习率0.01
    loss: 'meanSquaredError'       // 均方误差损失函数
  });

  console.log('开始训练模型...');
  
  // 训练模型
  await model.fit(xs, ys, {
    epochs: 100,        // 训练轮数
    batchSize: 10,      // 批次大小
    validationSplit: 0.2, // 20%数据用于验证
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (epoch % 20 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}`);
        }
      }
    }
  });

  // 进行预测
  console.log('\n--- 预测结果 ---');
  const testX = tf.tensor1d([11, 12, 13]);
  const predictions = model.predict(testX);
  
  console.log('输入:', testX.arraySync());
  console.log('预测:', predictions.arraySync());

  // 获取模型权重 (y = wx + b)
  const weights = model.getWeights();
  const w = weights[0].dataSync()[0];
  const b = weights[1].dataSync()[0];
  
  console.log(`\n学习到的公式: y = ${w.toFixed(2)}x + ${b.toFixed(2)}`);
  console.log('真实公式: y = 2x + 1');

  return model;
}

linearRegression();
```
运行命令：

```bash
node 2-linear-regression.js
```
阶段3：构建人口预测模型
3.1 完整的人口预测模型
```javascript
// 3-population-predictor.js
const tf = require('@tensorflow/tfjs-node');

class PopulationPredictor {
  constructor() {
    this.model = null;
    this.normalizationData = null;
  }

  // 生成模拟的小区人口数据
  generateSampleData(months = 24) {
    const data = [];
    let basePopulation = 1000;
    
    for (let i = 0; i < months; i++) {
      // 模拟季节性变化 + 趋势 + 噪声
      const seasonal = 50 * Math.sin((i / 12) * 2 * Math.PI);
      const trend = i * 8; // 每月增长8人
      const noise = (Math.random() - 0.5) * 20;
      
      const population = Math.round(basePopulation + trend + seasonal + noise);
      
      data.push({
        month: i + 1,
        population: population,
        season: (i % 12) + 1
      });
    }
    
    return data;
  }

  // 准备训练数据
  prepareData(data, lookBack = 6) {
    const xs = [];
    const ys = [];
    
    for (let i = lookBack; i < data.length; i++) {
      // 输入: 过去 lookBack 个月的人口数据
      const input = data.slice(i - lookBack, i).map(d => d.population);
      // 输出: 当前月的人口数据
      const output = data[i].population;
      
      xs.push(input);
      ys.push(output);
    }
    
    return { xs, ys };
  }

  // 数据标准化
  normalizeData(tensor) {
    const min = tensor.min();
    const max = tensor.max();
    const normalized = tensor.sub(min).div(max.sub(min));
    
    this.normalizationData = { min, max };
    return normalized;
  }

  // 反标准化
  denormalizeData(normalizedTensor) {
    if (!this.normalizationData) {
      throw new Error('必须先进行标准化');
    }
    const { min, max } = this.normalizationData;
    return normalizedTensor.mul(max.sub(min)).add(min);
  }

  // 构建模型
  buildModel(lookBack) {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [lookBack]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,  // 输出一个值：预测人口
      activation: 'linear'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'] // 平均绝对误差
    });

    return model;
  }

  // 训练模型
  async train(data, lookBack = 6) {
    console.log('准备数据...');
    const { xs, ys } = this.prepareData(data, lookBack);
    
    // 转换为张量
    const xsTensor = tf.tensor2d(xs);
    const ysTensor = tf.tensor1d(ys);
    
    // 标准化
    const xsNormalized = this.normalizeData(xsTensor);
    const ysNormalized = this.normalizeData(ysTensor);
    
    // 构建模型
    this.model = this.buildModel(lookBack);
    
    console.log('开始训练模型...');
    
    await this.model.fit(xsNormalized, ysNormalized, {
      epochs: 100,
      batchSize: 8,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(6)}, val_loss = ${logs.val_loss.toFixed(6)}`);
          }
        }
      }
    });
    
    console.log('训练完成!');
    
    // 清理内存
    xsTensor.dispose();
    ysTensor.dispose();
  }

  // 预测未来
  predictFuture(lastData, futureMonths = 6, lookBack = 6) {
    if (!this.model) {
      throw new Error('模型未训练');
    }

    let predictions = [];
    let currentInput = lastData.slice(-lookBack); // 取最后 lookBack 个数据点
    
    for (let i = 0; i < futureMonths; i++) {
      // 准备输入数据
      const inputTensor = tf.tensor2d([currentInput]);
      const inputNormalized = this.normalizeData(inputTensor);
      
      // 进行预测
      const predNormalized = this.model.predict(inputNormalized);
      const prediction = this.denormalizeData(predNormalized);
      
      const predValue = Math.round(prediction.dataSync()[0]);
      predictions.push(predValue);
      
      // 更新输入序列：移除第一个元素，添加预测值
      currentInput = [...currentInput.slice(1), predValue];
      
      // 清理内存
      inputTensor.dispose();
      inputNormalized.dispose();
      predNormalized.dispose();
      prediction.dispose();
    }
    
    return predictions;
  }
}

// 使用示例
async function main() {
  const predictor = new PopulationPredictor();
  
  // 1. 生成模拟数据
  console.log('生成模拟数据...');
  const sampleData = predictor.generateSampleData(24);
  console.log('前5个月数据:', sampleData.slice(0, 5));
  
  // 2. 训练模型
  await predictor.train(sampleData, 6);
  
  // 3. 进行预测
  const populationData = sampleData.map(d => d.population);
  const futurePredictions = predictor.predictFuture(populationData, 12, 6);
  
  console.log('\n=== 预测结果 ===');
  console.log('历史数据最后6个月:', populationData.slice(-6));
  console.log('未来12个月预测:', futurePredictions.map(p => Math.round(p)));
  
  // 4. 计算预测准确率 (与模拟数据的"真实"趋势比较)
  const lastReal = populationData[populationData.length - 1];
  console.log(`最后一个月真实人口: ${lastReal}`);
  console.log(`第一个月预测人口: ${Math.round(futurePredictions[0])}`);
  console.log(`预测误差: ${Math.round(Math.abs(futurePredictions[0] - lastReal))} 人`);
}

main().catch(console.error);
```
运行命令：

```bash
node 3-population-predictor.js
```
阶段4：Web API 集成
4.1 创建预测API服务
```javascript
// 4-api-server.js
const express = require('express');
const tf = require('@tensorflow/tfjs-node');
const { PopulationPredictor } = require('./3-population-predictor');

const app = express();
const port = 3000;

app.use(express.json());

// 初始化预测器
const predictor = new PopulationPredictor();
let isModelTrained = false;

// 训练端点
app.post('/api/train', async (req, res) => {
  try {
    const { data, lookBack = 6 } = req.body;
    
    if (!data || data.length < 12) {
      return res.status(400).json({ 
        error: '需要至少12个月的数据进行训练' 
      });
    }

    console.log('开始训练模型...');
    await predictor.train(data, lookBack);
    isModelTrained = true;
    
    res.json({ 
      success: true, 
      message: '模型训练完成',
      dataPoints: data.length 
    });
    
  } catch (error) {
    console.error('训练错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 预测端点
app.post('/api/predict', async (req, res) => {
  try {
    if (!isModelTrained) {
      return res.status(400).json({ 
        error: '请先训练模型' 
      });
    }

    const { historicalData, futureMonths = 6 } = req.body;
    
    if (!historicalData || historicalData.length < 6) {
      return res.status(400).json({ 
        error: '需要至少6个月的历史数据进行预测' 
      });
    }

    const predictions = predictor.predictFuture(
      historicalData, 
      futureMonths, 
      6
    );

    res.json({
      success: true,
      predictions: predictions.map(p => Math.round(p)),
      historicalData: historicalData.slice(-6),
      futureMonths
    });
    
  } catch (error) {
    console.error('预测错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 生成示例数据端点
app.get('/api/sample-data', (req, res) => {
  const sampleData = predictor.generateSampleData(24);
  res.json({
    success: true,
    data: sampleData,
    description: '24个月的模拟小区人口数据'
  });
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    modelTrained: isModelTrained,
    tensorflow: 'ready'
  });
});

app.listen(port, () => {
  console.log(`人口预测API服务运行在 http://localhost:${port}`);
  console.log('可用端点:');
  console.log('  GET  /api/health          - 健康检查');
  console.log('  GET  /api/sample-data     - 获取示例数据');
  console.log('  POST /api/train           - 训练模型');
  console.log('  POST /api/predict         - 进行预测');
});
```
4.2 测试API
```bash
# 启动服务
node 4-api-server.js

# 在另一个终端测试
curl http://localhost:3000/api/health
curl http://localhost:3000/api/sample-data
```
阶段5：前端界面（可选）
你可以创建一个简单的前端页面来调用这些API，使用React、Vue或纯JavaScript。这里提供一个简单的HTML示例：

```html
<!-- public/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>人口预测系统</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <h1>小区人口预测系统</h1>
    
    <div>
        <button onclick="getSampleData()">获取示例数据</button>
        <button onclick="trainModel()">训练模型</button>
        <button onclick="makePrediction()">进行预测</button>
    </div>
    
    <div id="results"></div>
    <canvas id="chart" width="800" height="400"></canvas>

    <script>
        async function getSampleData() {
            const response = await fetch('/api/sample-data');
            const data = await response.json();
            console.log('示例数据:', data);
            displayResults(data);
        }

        async function trainModel() {
            const sampleResponse = await fetch('/api/sample-data');
            const sampleData = await sampleResponse.json();
            
            const response = await fetch('/api/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: sampleData.data })
            });
            
            const result = await response.json();
            displayResults(result);
        }

        async function makePrediction() {
            const sampleResponse = await fetch('/api/sample-data');
            const sampleData = await sampleResponse.json();
            const historicalData = sampleData.data.map(d => d.population);
            
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    historicalData: historicalData,
                    futureMonths: 12 
                })
            });
            
            const result = await response.json();
            displayResults(result);
            drawChart(historicalData, result.predictions);
        }

        function displayResults(data) {
            document.getElementById('results').innerHTML = 
                '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        }

        function drawChart(historical, predictions) {
            const ctx = document.getElementById('chart').getContext('2d');
            
            const labels = [
                ...historical.map((_, i) => `Month ${i + 1}`),
                ...predictions.map((_, i) => `Pred ${i + 1}`)
            ];
            
            const data = {
                labels: labels,
                datasets: [{
                    label: '历史数据',
                    data: [...historical, ...Array(predictions.length).fill(null)],
                    borderColor: 'blue',
                    backgroundColor: 'rgba(0, 0, 255, 0.1)'
                }, {
                    label: '预测数据',
                    data: [...Array(historical.length).fill(null), ...predictions],
                    borderColor: 'red',
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                    borderDash: [5, 5]
                }]
            };
            
            new Chart(ctx, {
                type: 'line',
                data: data,
                options: { responsive: true }
            });
        }
    </script>
</body>
</html>
```