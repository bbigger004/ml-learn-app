// 1-data-basics.js
const tf = require('@tensorflow/tfjs');

async function tensorBasics() {
  console.log('=== TensorFlow.js 基础示例 ===');
  console.log('使用的后端:', tf.getBackend());
  
  // 1. 创建张量
  const vector = tf.tensor1d([1, 2, 3, 4, 5]);
  console.log('\n1. 一维张量:');
  console.log('数据:', vector.arraySync());
  console.log('形状:', vector.shape);
  console.log('数据类型:', vector.dtype);

  // 2. 张量运算
  const a = tf.tensor1d([1, 2, 3]);
  const b = tf.tensor1d([4, 5, 6]);
  
  console.log('\n2. 张量运算:');
  console.log('a + b =', a.add(b).arraySync());
  console.log('a * b =', a.mul(b).arraySync());
  console.log('点积 =', a.dot(b).arraySync());

  // 3. 矩阵运算
  const matrix = tf.tensor2d([[1, 2], [3, 4]]);
  console.log('\n3. 矩阵运算:');
  console.log('矩阵:');
  matrix.print();
  console.log('矩阵转置:');
  matrix.transpose().print();
}

// async function dataPreparation() {
//   console.log('\n=== 数据准备 ===');
  
//   // 模拟人口数据
//   const populationData = [1000, 1050, 1100, 1150, 1200, 1250, 1300, 1350];
  
//   // 创建特征 (时间) 和标签 (人口)
//   const time = tf.tensor1d([1, 2, 3, 4, 5, 6, 7, 8]);
//   const population = tf.tensor1d(populationData);
  
//   // 数据标准化
//   const timeNormalized = time.div(time.max());
//   const populationNormalized = population.div(population.max());
  
//   console.log('原始时间数据:', time.arraySync());
//   console.log('标准化时间数据:', timeNormalized.arraySync());
//   console.log('原始人口数据:', population.arraySync());
//   console.log('标准化人口数据:', populationNormalized.arraySync());
  
//   return { time, population, timeNormalized, populationNormalized };
// }

// async function simpleLinearRegression() {
//   console.log('\n=== 简单线性回归 ===');
  
//   // 生成模拟数据 y = 2x + 1 + 噪声
//   const xs = tf.tensor1d([1, 2, 3, 4, 5]);
//   const ys = tf.tensor1d([3.2, 4.8, 7.1, 8.9, 11.2]);
  
//   // 创建模型
//   const model = tf.sequential();
//   model.add(tf.layers.dense({
//     units: 1,
//     inputShape: [1]
//   }));
  
//   // 编译模型
//   model.compile({
//     optimizer: tf.train.sgd(0.01),
//     loss: 'meanSquaredError'
//   });
  
//   console.log('开始训练...');
  
//   // 训练模型
//   await model.fit(xs, ys, {
//     epochs: 100,
//     callbacks: {
//       onEpochEnd: (epoch, logs) => {
//         if (epoch % 25 === 0) {
//           console.log(`轮次 ${epoch}: 损失 = ${logs.loss.toFixed(4)}`);
//         }
//       }
//     }
//   });
  
//   // 预测
//   const testX = tf.tensor1d([6, 7, 8]);
//   const predictions = model.predict(testX);
  
//   console.log('\n预测结果:');
//   console.log('输入:', testX.arraySync());
//   console.log('预测:', predictions.arraySync());
  
//   // 显示学习到的参数
//   const weights = model.getWeights();
//   const slope = weights[0].dataSync()[0];
//   const intercept = weights[1].dataSync()[0];
//   console.log(`\n学习到的公式: y = ${slope.toFixed(2)}x + ${intercept.toFixed(2)}`);
// }

// 主函数
async function main() {
  try {
    await tensorBasics();
    // await dataPreparation();
    // await simpleLinearRegression();
    
    // console.log('\n🎉 所有示例运行完成!');
    // console.log('现在你可以继续学习更复杂的模型了。');
    
  } catch (error) {
    console.error('发生错误:', error);
  }
}

main();