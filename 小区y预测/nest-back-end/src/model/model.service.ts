import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';
import { DataService } from '../data/data.service';

@Injectable()
export class ModelService {
  private readonly modelPath = path.join(__dirname, '../../models');
  private models: Map<string, tf.LayersModel> = new Map();
  private modelConfigs: Map<string, any> = new Map(); // 存储模型配置

  constructor(private readonly dataService: DataService) {
    // 确保模型目录存在
    if (!fs.existsSync(this.modelPath)) {
      fs.mkdirSync(this.modelPath, { recursive: true });
    }
  }

  /**
   * 创建并训练模型
   */
  async trainModel(
    modelType: 'lstm' | 'gru' | 'cnn-lstm' | 'mlp',
    trainingData: any[],
    features: string[],
    target: string,
    config: any
  ): Promise<{ modelId: string; metrics: any }> {
    try {
      // 准备训练数据
      let xs: tf.Tensor;
      let ys: tf.Tensor;
      let model: tf.LayersModel;

      if (modelType === 'mlp') {
        // 为MLP准备数据（不需要时间窗口）
        const { x, y } = this.prepareDataForMlp(trainingData, features, target);
        xs = x;
        ys = y;
        model = this.createMlpModel(xs.shape[1], config);
      } else {
        // 为序列模型准备数据
        const lookback = config.lookback || 6;
        const { xs: sequenceXs, ys: sequenceYs } = this.prepareDataForSequence(trainingData, features, target, lookback);
        xs = sequenceXs;
        ys = sequenceYs;
        
        // 根据模型类型创建不同的模型
        switch (modelType) {
          case 'lstm':
            model = this.createLstmModel(xs.shape[1], xs.shape[2], config);
            break;
          case 'gru':
            model = this.createGruModel(xs.shape[1], xs.shape[2], config);
            break;
          case 'cnn-lstm':
            model = this.createCnnLstmModel(xs.shape[1], xs.shape[2], config);
            break;
          default:
            throw new Error(`不支持的模型类型: ${modelType}`);
        }
      }
      
      // 编译模型
      model.compile({
        optimizer: tf.train.adam(config.learningRate || 0.001),
        loss: 'meanSquaredError',
        metrics: ['mae'],
      });
      
      // 训练模型
      const history = await model.fit(xs, ys, {
        epochs: config.epochs || 50,
        batchSize: config.batchSize || 32,
        validationSplit: config.validationSplit || 0.2,
        shuffle: false, // 时间序列数据不要打乱
        callbacks: [
          tf.callbacks.earlyStopping({
            monitor: 'val_loss',
            patience: config.patience || 10,
            restoreBestWeights: true,
          })
        ],
      });
      
      // 保存模型
      const modelId = `${modelType}_${Date.now()}`;
      const savePath = path.join(this.modelPath, modelId);
      await model.save(`file://${savePath}`);
      
      // 保存模型配置
      const modelConfig = {
        modelType,
        features,
        target,
        config,
        trainingDataSize: trainingData.length,
        timestamp: new Date().toISOString()
      };
      
      fs.writeFileSync(
        path.join(savePath, 'config.json'),
        JSON.stringify(modelConfig, null, 2)
      );
      
      // 缓存模型和配置
      this.models.set(modelId, model);
      this.modelConfigs.set(modelId, modelConfig);
      
      return {
        modelId,
        metrics: history.history,
      };
    } catch (error) {
      throw new HttpException(
        `模型训练失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 超参数优化
   */
  async optimizeHyperparameters(
    modelType: 'lstm' | 'gru' | 'cnn-lstm' | 'mlp',
    trainingData: any[],
    features: string[],
    target: string,
    hyperparamsGrid: any
  ): Promise<{ bestParams: any; bestMetrics: any }> {
    try {
      let bestScore = Infinity;
      let bestParams: any = null;
      let bestMetrics: any = null;

      // 生成超参数组合
      const paramCombinations = this.generateParamCombinations(hyperparamsGrid);

      // 对每个参数组合进行训练和评估
      for (const params of paramCombinations) {
        // 使用交叉验证评估模型
        const cvResults = await this.crossValidate(
          modelType,
          trainingData,
          features,
          target,
          params,
          5 // 5折交叉验证
        );

        // 计算平均损失作为评分
        const avgLoss = cvResults.losses.reduce((sum, loss) => sum + loss, 0) / cvResults.losses.length;

        // 如果这组参数更好，更新最佳参数
        if (avgLoss < bestScore) {
          bestScore = avgLoss;
          bestParams = params;
          bestMetrics = {
            avgLoss,
            avgMAE: cvResults.maes.reduce((sum, mae) => sum + mae, 0) / cvResults.maes.length,
            avgR2: cvResults.r2s.reduce((sum, r2) => sum + r2, 0) / cvResults.r2s.length
          };
        }
      }

      return {
        bestParams,
        bestMetrics
      };
    } catch (error) {
      throw new HttpException(
        `超参数优化失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 创建LSTM模型架构
   */
  private createLstmModel(inputLength: number, inputFeatures: number, config: any): tf.LayersModel {
    const model = tf.sequential();
    
    // 添加LSTM层
    model.add(
      tf.layers.lstm({
        units: config.units || 64,
        returnSequences: true,
        inputShape: [inputLength, inputFeatures],
        dropout: config.dropout || 0.2,
      })
    );
    
    // 添加第二层LSTM（如果需要）
    if (config.depth > 1) {
      model.add(
        tf.layers.lstm({
          units: config.units || 32,
          dropout: config.dropout || 0.2,
        })
      );
    } else {
      model.add(tf.layers.flatten());
    }
    
    // 添加全连接层
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    
    // 输出层
    model.add(tf.layers.dense({ units: 1 }));
    
    return model;
  }

  /**
   * 创建GRU模型架构
   */
  private createGruModel(inputLength: number, inputFeatures: number, config: any): tf.LayersModel {
    const model = tf.sequential();
    
    // 添加GRU层
    model.add(
      tf.layers.gru({
        units: config.units || 64,
        returnSequences: config.depth > 1,
        inputShape: [inputLength, inputFeatures],
        dropout: config.dropout || 0.2,
      })
    );
    
    // 添加第二层GRU（如果需要）
    if (config.depth > 1) {
      model.add(
        tf.layers.gru({
          units: config.units || 32,
          dropout: config.dropout || 0.2,
        })
      );
    }
    
    // 添加全连接层
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    
    // 输出层
    model.add(tf.layers.dense({ units: 1 }));
    
    return model;
  }

  /**
   * 创建CNN-LSTM模型架构
   */
  private createCnnLstmModel(inputLength: number, inputFeatures: number, config: any): tf.LayersModel {
    const model = tf.sequential();
    
    // 添加CNN层捕获局部特征
    model.add(
      tf.layers.conv1d({
        filters: config.cnnFilters || 64,
        kernelSize: config.kernelSize || 3,
        padding: 'same',
        activation: 'relu',
        inputShape: [inputLength, inputFeatures],
      })
    );
    
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }));
    
    // 添加LSTM层捕获时序特征
    model.add(
      tf.layers.lstm({
        units: config.units || 64,
        returnSequences: config.depth > 1,
        dropout: config.dropout || 0.2,
      })
    );
    
    if (config.depth > 1) {
      model.add(
        tf.layers.lstm({
          units: config.units || 32,
          dropout: config.dropout || 0.2,
        })
      );
    }
    
    // 添加全连接层
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    
    // 输出层
    model.add(tf.layers.dense({ units: 1 }));
    
    return model;
  }

  /**
   * 创建MLP模型架构
   */
  private createMlpModel(inputFeatures: number, config: any): tf.LayersModel {
    const model = tf.sequential();
    
    // 输入层
    model.add(tf.layers.dense({
      units: config.units || 64,
      activation: 'relu',
      inputShape: [inputFeatures]
    }));
    
    // 添加dropout层防止过拟合
    model.add(tf.layers.dropout({ rate: config.dropout || 0.2 }));
    
    // 隐藏层
    for (let i = 0; i < (config.depth || 2) - 1; i++) {
      model.add(tf.layers.dense({
        units: config.units || 64,
        activation: 'relu'
      }));
      model.add(tf.layers.dropout({ rate: config.dropout || 0.2 }));
    }
    
    // 输出层
    model.add(tf.layers.dense({ units: 1 }));
    
    return model;
  }

  /**
   * 为序列模型准备时间序列数据
   */
  private prepareDataForSequence(data: any[], features: string[], target: string, lookback: number) {
    const featureData = data.map(item => features.map(f => item[f] || 0));
    const targetData = data.map(item => item[target] || 0);
    
    const xs: number[][] = [];
    const ys: number[] = [];
    
    // 创建时间窗口
    for (let i = lookback; i < data.length; i++) {
      const window = featureData.slice(i - lookback, i).flat();
      xs.push(window);
      ys.push(targetData[i]);
    }
    
    // 重塑为序列模型输入形状 [samples, time steps, features]
    const xsTensor = tf.tensor3d(xs as unknown as number[][][], [xs.length, lookback, features.length]);
    const ysTensor = tf.tensor2d(ys, [ys.length, 1]);
    
    return { xs: xsTensor, ys: ysTensor };
  }

  /**
   * 为MLP模型准备数据
   */
  private prepareDataForMlp(data: any[], features: string[], target: string) {
    const xs = data.map(item => features.map(f => item[f] || 0));
    const ys = data.map(item => [item[target] || 0]);
    
    return {
      x: tf.tensor2d(xs),
      y: tf.tensor2d(ys)
    };
  }

  /**
   * 加载模型
   */
  async loadModel(modelId: string): Promise<tf.LayersModel> {
    try {
      // 检查缓存
      if (this.models.has(modelId)) {
        return this.models.get(modelId)!;
      }
      
      // 从文件系统加载
      const loadPath = path.join(this.modelPath, modelId);
      const model = await tf.loadLayersModel(`file://${loadPath}/model.json`);
      
      // 加载模型配置
      const configPath = path.join(loadPath, 'config.json');
      let config = null;
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
      
      // 缓存模型和配置
      this.models.set(modelId, model);
      this.modelConfigs.set(modelId, config);
      
      return model;
    } catch (error) {
      throw new HttpException(
        `模型加载失败: ${error.message}`,
        HttpStatus.NOT_FOUND,
      );
    }
  }

  /**
   * 评估模型性能
   */
  async evaluateModel(modelId: string, testData: any[], features: string[], target: string, lookback?: number): Promise<any> {
    try {
      const model = await this.loadModel(modelId);
      const config = this.modelConfigs.get(modelId);
      
      let xs: tf.Tensor;
      let ys: tf.Tensor;
      
      if (config && config.modelType === 'mlp') {
        // 为MLP准备数据
        const { x, y } = this.prepareDataForMlp(testData, features, target);
        xs = x;
        ys = y;
      } else {
        // 为序列模型准备数据
        const sequenceLookback = lookback || (config?.config?.lookback || 6);
        const { xs: sequenceXs, ys: sequenceYs } = this.prepareDataForSequence(testData, features, target, sequenceLookback);
        xs = sequenceXs;
        ys = sequenceYs;
      }
      
      const evaluation = model.evaluate(xs, ys);
      const loss = evaluation[0].dataSync()[0];
      const mae = evaluation[1] ? evaluation[1].dataSync()[0] : null;
      
      // 计算预测结果用于进一步分析
      const predictions = model.predict(xs) as tf.Tensor;
      const yTrue = ys.dataSync();
      const yPred = predictions.dataSync();
      
      // 计算R²分数
      const r2 = this.calculateR2(yTrue as Float32Array, yPred as Float32Array);

      // 计算其他评估指标
      const rmse = Math.sqrt(loss);
      const mape = this.calculateMAPE(yTrue as Float32Array, yPred as Float32Array);
      const mase = this.calculateMASE(yTrue as Float32Array, yPred as Float32Array);
      
      // 计算预测结果列表（用于可视化）
      const predictionList = testData.slice(xs.shape[0] - ys.shape[0]).map((item, i) => ({
        ...item,
        prediction: yPred[i]
      }));
      
      return {
        loss,
        rmse,
        mae,
        mape,
        mase,
        r2,
        samples: xs.shape[0],
        predictions: predictionList.slice(0, 100) // 限制返回数量避免过大
      };
    } catch (error) {
      throw new HttpException(
        `模型评估失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 进行单步预测
   */
  async predict(modelId: string, inputData: any[], features: string[], lookback?: number): Promise<number[]> {
    try {
      const model = await this.loadModel(modelId);
      const config = this.modelConfigs.get(modelId);
      
      if (config && config.modelType === 'mlp') {
        // MLP预测
        const x = tf.tensor2d(inputData.map(item => features.map(f => item[f] || 0)));
        const predictions = model.predict(x) as tf.Tensor;
        return Array.from(predictions.dataSync());
      } else {
        // 序列模型预测
        const sequenceLookback = lookback || (config?.config?.lookback || 6);
        const featureData = inputData.map(item => features.map(f => item[f] || 0));
        
        // 准备预测数据
        const predictXs: number[][][] = [];
        for (let i = sequenceLookback; i <= featureData.length; i++) {
          predictXs.push(featureData.slice(i - sequenceLookback, i));
        }
        
        if (predictXs.length === 0) {
          return [];
        }
        
        const xsTensor = tf.tensor3d(predictXs);
        const predictions = model.predict(xsTensor) as tf.Tensor;
        return Array.from(predictions.dataSync());
      }
    } catch (error) {
      throw new HttpException(
        `预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 进行多步预测
   */
  async predictMultiStep(modelId: string, inputData: any[], features: string[], steps: number, lookback?: number): Promise<number[]> {
    try {
      const model = await this.loadModel(modelId);
      const config = this.modelConfigs.get(modelId);
      
      // MLP模型不支持多步预测
      if (config && config.modelType === 'mlp') {
        throw new Error('MLP模型不支持多步预测');
      }
      
      const sequenceLookback = lookback || (config?.config?.lookback || 6);
      let featureData = inputData.map(item => features.map(f => item[f] || 0));
      
      // 确保有足够的数据进行预测
      if (featureData.length < sequenceLookback) {
        throw new Error('输入数据不足');
      }
      
      const predictions: number[] = [];
      let currentWindow = featureData.slice(-sequenceLookback);
      
      // 逐步预测
      for (let i = 0; i < steps; i++) {
        // 准备输入张量
        const inputTensor = tf.tensor3d([currentWindow]);
        
        // 进行预测
        const prediction = model.predict(inputTensor) as tf.Tensor;
        const predValue = prediction.dataSync()[0];
        predictions.push(predValue);
        
        // 更新窗口（假设目标变量是最后一个特征）
        const newPoint = [...currentWindow[currentWindow.length - 1]];
        newPoint[newPoint.length - 1] = predValue; // 用预测值替换目标变量
        
        currentWindow = [...currentWindow.slice(1), newPoint];
      }
      
      return predictions;
    } catch (error) {
      throw new HttpException(
        `多步预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 批量预测
   */
  async batchPredict(modelId: string, batchData: { data: any[], features: string[], lookback?: number }[]): Promise<any[]> {
    try {
      const results = [];
      
      for (const item of batchData) {
        const predictions = await this.predict(
          modelId,
          item.data,
          item.features,
          item.lookback
        );
        
        results.push({
          inputSize: item.data.length,
          predictions
        });
      }
      
      return results;
    } catch (error) {
      throw new HttpException(
        `批量预测失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 比较多个模型
   */
  async compareModels(modelIds: string[], testData: any[], features: string[], target: string): Promise<any[]> {
    try {
      const results = [];
      
      for (const modelId of modelIds) {
        try {
          const evaluation = await this.evaluateModel(modelId, testData, features, target);
          const config = this.modelConfigs.get(modelId);
          
          results.push({
            modelId,
            modelType: config?.modelType || 'unknown',
            evaluation,
            config: config || {}
          });
        } catch (error) {
          results.push({
            modelId,
            error: error.message
          });
        }
      }
      
      // 按性能排序（R²降序）
      return results.sort((a, b) => {
        if (a.error || b.error) return 0;
        return (b.evaluation.r2 || 0) - (a.evaluation.r2 || 0);
      });
    } catch (error) {
      throw new HttpException(
        `模型比较失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 计算R²分数
   */
  private calculateR2(yTrue: Float32Array, yPred: Float32Array): number {
    const mean = yTrue.reduce((a, b) => a + b, 0) / yTrue.length;
    const ssRes = yTrue.reduce((sum, trueVal, i) => {
      const diff = trueVal - yPred[i];
      return sum + diff * diff;
    }, 0);
    const ssTot = yTrue.reduce((sum, val) => {
      const diff = val - mean;
      return sum + diff * diff;
    }, 0);
    return 1 - (ssRes / ssTot);
  }

  /**
   * 计算平均绝对百分比误差（MAPE）
   */
  private calculateMAPE(yTrue: Float32Array, yPred: Float32Array): number {
    let sum = 0;
    let count = 0;
    
    for (let i = 0; i < yTrue.length; i++) {
      if (Math.abs(yTrue[i]) > 0.0001) { // 避免除以零
        sum += Math.abs((yTrue[i] - yPred[i]) / yTrue[i]);
        count++;
      }
    }
    
    return count > 0 ? (sum / count) * 100 : 0;
  }

  /**
   * 计算平均绝对比例误差（MASE）
   */
  private calculateMASE(yTrue: Float32Array, yPred: Float32Array): number {
    // 计算朴素预测的平均绝对误差（使用前一天的值作为预测）
    let naiveErrorSum = 0;
    for (let i = 1; i < yTrue.length; i++) {
      naiveErrorSum += Math.abs(yTrue[i] - yTrue[i - 1]);
    }
    const naiveMAE = naiveErrorSum / (yTrue.length - 1);
    
    // 计算模型的平均绝对误差
    let modelErrorSum = 0;
    for (let i = 0; i < yTrue.length; i++) {
      modelErrorSum += Math.abs(yTrue[i] - yPred[i]);
    }
    const modelMAE = modelErrorSum / yTrue.length;
    
    return naiveMAE > 0 ? modelMAE / naiveMAE : 0;
  }

  /**
   * 交叉验证
   */
  private async crossValidate(
    modelType: 'lstm' | 'gru' | 'cnn-lstm' | 'mlp',
    data: any[],
    features: string[],
    target: string,
    config: any,
    folds: number
  ): Promise<{ losses: number[]; maes: number[]; r2s: number[] }> {
    const losses: number[] = [];
    const maes: number[] = [];
    const r2s: number[] = [];
    
    const foldSize = Math.floor(data.length / folds);
    
    for (let i = 0; i < folds; i++) {
      // 划分训练集和验证集
      const valStart = i * foldSize;
      const valEnd = valStart + foldSize;
      
      const trainData = [
        ...data.slice(0, valStart),
        ...data.slice(valEnd)
      ];
      
      const valData = data.slice(valStart, valEnd);
      
      // 训练模型
      const result = await this.trainModel(
        modelType,
        trainData,
        features,
        target,
        { ...config, epochs: config.epochs || 20 }
      );
      
      // 评估模型
      const evaluation = await this.evaluateModel(
        result.modelId,
        valData,
        features,
        target,
        config.lookback
      );
      
      // 记录结果
      losses.push(evaluation.loss);
      maes.push(evaluation.mae || 0);
      r2s.push(evaluation.r2);
      
      // 清理模型
      await this.deleteModel(result.modelId);
    }
    
    return { losses, maes, r2s };
  }

  /**
   * 生成超参数组合
   */
  private generateParamCombinations(hyperparamsGrid: any): any[] {
    // 简单实现：生成参数组合
    const keys = Object.keys(hyperparamsGrid);
    if (keys.length === 0) return [{}];
    
    let combinations = [{}];
    
    for (const key of keys) {
      const newCombinations = [];
      const values = hyperparamsGrid[key];
      
      for (const combo of combinations) {
        for (const value of values) {
          newCombinations.push({ ...combo, [key]: value });
        }
      }
      
      combinations = newCombinations;
    }
    
    return combinations;
  }

  /**
   * 获取模型列表
   */
  async getModelList(): Promise<any[]> {
    try {
      const files = fs.readdirSync(this.modelPath);
      const modelList = [];
      
      for (const file of files) {
        const modelDir = path.join(this.modelPath, file);
        if (fs.statSync(modelDir).isDirectory()) {
          const modelInfo = {
            modelId: file,
            createdAt: fs.statSync(modelDir).birthtime,
            type: 'unknown',
            features: [],
            trainingDataSize: 0
          };
          
          // 尝试加载配置信息
          const configPath = path.join(modelDir, 'config.json');
          if (fs.existsSync(configPath)) {
            try {
              const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
              modelInfo.type = config.modelType || 'unknown';
              modelInfo.features = config.features || [];
              modelInfo.trainingDataSize = config.trainingDataSize || 0;
              // modelInfo.timestamp = config.timestamp;
            } catch (e) {
              // 配置文件读取失败，使用默认值
            }
          }
          
          modelList.push(modelInfo);
        }
      }
      
      // 按创建时间降序排序
      return modelList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new HttpException(
        `获取模型列表失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 删除模型
   */
  async deleteModel(modelId: string): Promise<void> {
    try {
      const modelDir = path.join(this.modelPath, modelId);
      
      if (fs.existsSync(modelDir)) {
        // 删除模型文件
        this.removeDirectory(modelDir);
        
        // 从缓存中移除
      this.models.delete(modelId);
      this.modelConfigs.delete(modelId);
      } else {
        throw new Error('模型不存在');
      }
    } catch (error) {
      throw new HttpException(
        `删除模型失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 递归删除目录
   */
  private removeDirectory(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          this.removeDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  }
}