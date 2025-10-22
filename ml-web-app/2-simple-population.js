// 2-simple-population.js
const tf = require('@tensorflow/tfjs');

class SimplePopulationPredictor {
  constructor() {
    this.model = null;
  }
  
  // 生成模拟数据
  generateData(months = 24) {
    const data = [];
    let population = 1000;
    
    for (let i = 0; i < months; i++) {
      // 模拟增长 + 季节性 + 噪声
      const growth = 10; // 每月基础增长
      const seasonal = 20 * Math.sin((i / 6) * Math.PI); // 半年周期
      const noise = (Math.random() - 0.5) * 15;
      
      population += growth + seasonal + noise;
      data.push({
        month: i + 1,
        population: Math.round(population)
      });
    }
    
    return data;
  }
  
  // 准备训练数据
  prepareTrainingData(data, sequenceLength = 3) {
    const xs = [];
    const ys = [];
    
    for (let i = sequenceLength; i < data.length; i++) {
      const sequence = data.slice(i - sequenceLength, i).map(d => d.population);
      const nextValue = data[i].population;
      
      xs.push(sequence);
      ys.push(nextValue);
    }
    
    return {
      xs: tf.tensor2d(xs),
      ys: tf.tensor1d(ys)
    };
  }
  
  // 构建模型
  buildModel(inputLength) {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 10,
      activation: 'relu',
      inputShape: [inputLength]
    }));
    
    model.add(tf.layers.dense({
      units: 5,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.01),
      loss: 'meanSquaredError'
    });
    
    return model;
  }
  
  async train() {
    console.log('生成训练数据...');
    const data = this.generateData(36); // 3年数据
    console.log('数据示例:', data.slice(0, 5));
    
    const sequenceLength = 6;
    const { xs, ys } = this.prepareTrainingData(data, sequenceLength);
    
    this.model = this.buildModel(sequenceLength);
    
    console.log('开始训练模型...');
    
    await this.model.fit(xs, ys, {
      epochs: 200,
      batchSize: 8,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 40 === 0) {
            console.log(`轮次 ${epoch}: 损失 = ${logs.loss.toFixed(2)}`);
          }
        }
      }
    });
    
    console.log('训练完成!');
    
    // 测试预测
    this.testPrediction(data, sequenceLength);
  }
  
  testPrediction(data, sequenceLength) {
    const lastSequence = data.slice(-sequenceLength).map(d => d.population);
    const input = tf.tensor2d([lastSequence]);
    const prediction = this.model.predict(input);
    
    console.log('\n=== 预测测试 ===');
    console.log('输入序列:', lastSequence);
    console.log('预测的下一个月人口:', Math.round(prediction.dataSync()[0]));
    console.log('实际的下一个月应该是增长趋势');
    
    // 预测未来多个月份
    this.predictFuture(lastSequence, 6);
  }
  
  predictFuture(initialSequence, months = 6) {
    let sequence = [...initialSequence];
    const predictions = [];
    
    console.log(`\n=== 未来 ${months} 个月预测 ===`);
    
    for (let i = 0; i < months; i++) {
      const input = tf.tensor2d([sequence]);
      const prediction = this.model.predict(input);
      const nextValue = Math.round(prediction.dataSync()[0]);
      
      predictions.push(nextValue);
      console.log(`第 ${i + 1} 个月: ${nextValue} 人`);
      
      // 更新序列
      sequence = [...sequence.slice(1), nextValue];
      
      // 清理内存
      input.dispose();
      prediction.dispose();
    }
    
    return predictions;
  }
}

// 运行示例
async function runDemo() {
  const predictor = new SimplePopulationPredictor();
  await predictor.train();
}

runDemo().catch(console.error);