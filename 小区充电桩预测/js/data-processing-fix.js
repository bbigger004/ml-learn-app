// 数据处理和训练错误修复
// 此文件包含对数据处理和训练流程的改进

// 改进的数据验证函数
function validateData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) {
        throw new Error('数据为空或格式不正确');
    }
    
    // 检查每行数据
    const validRows = [];
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || !Array.isArray(row)) {
            console.warn(`跳过无效行 ${i}:`, row);
            continue;
        }
        
        // 检查目标值（假设最后一列是目标值）
        const targetValue = row[row.length - 1];
        if (targetValue === null || targetValue === undefined || targetValue === '') {
            console.warn(`跳过目标值为空的行 ${i}:`, row);
            continue;
        }
        
        // 检查目标值是否为数字
        const numTarget = Number(targetValue);
        if (isNaN(numTarget)) {
            console.warn(`跳过目标值非数字的行 ${i}:`, row);
            continue;
        }
        
        // 检查特征值 - 至少需要一个有效的数值特征
        let validFeatureCount = 0;
        for (let j = 0; j < row.length - 1; j++) {
            if (row[j] !== null && row[j] !== undefined && row[j] !== '') {
                const numValue = Number(row[j]);
                if (!isNaN(numValue)) {
                    validFeatureCount++;
                }
            }
        }
        
        // 如果没有有效的数值特征，跳过该行
        if (validFeatureCount === 0) {
            console.warn(`跳过没有有效数值特征的行 ${i}:`, row);
            continue;
        }
        
        // 如果通过了所有检查，添加到有效行
        validRows.push(row);
    }
    
    if (validRows.length === 0) {
        throw new Error('没有有效的数据行');
    }
    
    console.log(`数据验证完成，从 ${data.length} 行中筛选出 ${validRows.length} 有效行`);
    return validRows;
}

// 改进的特征提取函数
function extractFeatures(row, headers) {
    const features = [];
    
 
    // 注意：在app.js中已经添加了区域编码作为第一个特征，所以这里从索引1开始
    for (let i = 1; i < row.length - 1; i++) {
        const value = row[i];
        if (value === null || value === undefined || value === '') {
            features.push(0); // 默认值
        } else {
            const numValue = Number(value);
            features.push(isNaN(numValue) ? 0 : numValue);
        }
    }
    
    // 确保我们有22个特征（因为app.js已经添加了区域编码作为第一个特征）
    // 如果特征数量不足，用0填充
    while (features.length < 22) {
        features.push(0);
    }
    
    // 如果特征数量过多，截断
    if (features.length > 22) {
        features.length = 22;
    }
    
    return features;
}

// 改进的归一化函数
function normalizeFeatures(features, normParams = null) {
    if (!normParams) {
        // 首次归一化，计算参数
        const numFeatures = features[0].length;
        // 分离区域编码和其他特征
        const regionCodes = features.map(row => row[0]);
        const otherFeatures = features.map(row => row.slice(1));
        const numOtherFeatures = numFeatures - 1;
        
        const means = new Array(numOtherFeatures).fill(0);
        const stds = new Array(numOtherFeatures).fill(0);
        
        // 计算其他特征的均值（跳过区域编码）
        for (let i = 0; i < otherFeatures.length; i++) {
            for (let j = 0; j < numOtherFeatures; j++) {
                means[j] += otherFeatures[i][j];
            }
        }
        
        for (let j = 0; j < numOtherFeatures; j++) {
            means[j] /= otherFeatures.length;
        }
        
        // 计算其他特征的标准差
        for (let i = 0; i < otherFeatures.length; i++) {
            for (let j = 0; j < numOtherFeatures; j++) {
                stds[j] += Math.pow(otherFeatures[i][j] - means[j], 2);
            }
        }
        
        for (let j = 0; j < numOtherFeatures; j++) {
            stds[j] = Math.sqrt(stds[j] / otherFeatures.length);
            // 避免除以0
            if (stds[j] < 1e-7) {
                stds[j] = 1;
            }
        }
        
        normParams = { means, stds };
    }
    
    // 应用归一化（区域编码保持不变）
    const normalizedFeatures = [];
    for (let i = 0; i < features.length; i++) {
        const normalizedRow = [features[i][0]]; // 保留原始区域编码
        // 归一化其他特征
        for (let j = 1; j < features[i].length; j++) {
            const featureIndex = j - 1; // 对应normParams中的索引
            normalizedRow.push((features[i][j] - normParams.means[featureIndex]) / normParams.stds[featureIndex]);
        }
        normalizedFeatures.push(normalizedRow);
    }
    
    return { normalizedFeatures, normParams };
}

// 改进的数据增强函数
function augmentData(features, targets, params = {}) {
    const noiseFactor = params.noiseFactor || 0.05;
    const augmentFactor = params.augmentFactor || 0.2; // 增强20%的数据
    
    const numSamples = features.length;
    const numAugmented = Math.floor(numSamples * augmentFactor);
    const augmentedFeatures = [...features];
    const augmentedTargets = [...targets];
    
    for (let i = 0; i < numAugmented; i++) {
        // 随机选择一个样本进行增强
        const randomIndex = Math.floor(Math.random() * numSamples);
        const originalFeature = [...features[randomIndex]];
        const originalTarget = targets[randomIndex];
        
        // 添加高斯噪声
        for (let j = 0; j < originalFeature.length; j++) {
            const noise = (Math.random() - 0.5) * 2 * noiseFactor;
            originalFeature[j] += noise;
        }
        
        augmentedFeatures.push(originalFeature);
        augmentedTargets.push(originalTarget);
    }
    
    console.log(`数据增强完成，从 ${numSamples} 个样本增加到 ${augmentedFeatures.length} 个样本`);
    return { augmentedFeatures, augmentedTargets };
}

// 改进的训练函数
async function improvedTrainModel(model, trainFeatures, trainTargets, params) {
    try {
        // 转换为张量
        const trainX = tf.tensor2d(trainFeatures);
        const trainY = tf.tensor2d(trainTargets.map(t => [t]));
        
        // 检查张量形状
        console.log(`训练数据形状: 特征 ${trainX.shape}, 目标 ${trainY.shape}`);
        
        // 验证模型输入形状
        const modelInputShape = model.inputs[0].shape;
        console.log(`模型输入形状: ${modelInputShape}`);
        
        if (trainX.shape[1] !== modelInputShape[1]) {
            throw new Error(`特征维度不匹配: 数据有 ${trainX.shape[1]} 个特征，但模型期望 ${modelInputShape[1]} 个特征`);
        }
        
        // 训练模型
        const history = await model.fit(trainX, trainY, {
            epochs: params.epochs || 50,
            batchSize: params.batchSize || 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
                    
                    // 调用用户提供的回调
                    if (params.onEpochEnd) {
                        params.onEpochEnd(epoch, logs);
                    }
                }
            }
        });
        
        // 清理内存
        trainX.dispose();
        trainY.dispose();
        
        return { success: true, history };
    } catch (error) {
        console.error('训练模型时出错:', error);
        return { success: false, error: error.message };
    }
}

// 完整的训练流程函数
async function trainModel(trainFeatures, trainTargets, testFeatures, testTargets, params, callbacks = {}) {
    try {
        // 创建模型
        const model = createModel(params);
        
        // 数据增强
        const { augmentedFeatures, augmentedTargets } = augmentData(
            trainFeatures,
            trainTargets,
            {
                noiseFactor: params.noiseLevel || 0.05,
                augmentFactor: params.augmentationRatio || 0.2
            }
        );
        
        // 转换为张量
        const trainX = tf.tensor2d(augmentedFeatures);
        const trainY = tf.tensor2d(augmentedTargets.map(t => [t]));
        
        // 检查张量形状
        console.log(`训练数据形状: 特征 ${trainX.shape}, 目标 ${trainY.shape}`);
        
        // 验证模型输入形状
        const modelInputShape = model.inputs[0].shape;
        console.log(`模型输入形状: ${modelInputShape}`);
        
        if (trainX.shape[1] !== modelInputShape[1]) {
            throw new Error(`特征维度不匹配: 数据有 ${trainX.shape[1]} 个特征，但模型期望 ${modelInputShape[1]} 个特征`);
        }
        
        // 训练模型
        const history = await model.fit(trainX, trainY, {
            epochs: params.epochs || 50,
            batchSize: params.batchSize || 32,
            validationSplit: 0.2,
            shuffle: true,
            callbacks: {
                onEpochEnd: (epoch, logs) => {
                    console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, val_loss = ${logs.val_loss.toFixed(4)}`);
                    
                    // 调用用户提供的回调
                    if (callbacks.onEpochEnd) {
                        callbacks.onEpochEnd(epoch, logs);
                    }
                }
            }
        });
        
        // 清理内存
        trainX.dispose();
        trainY.dispose();
        
        // 评估模型
        const metrics = await evaluateModelWithTestData(model, testFeatures, testTargets);
        
        return {
            model,
            metrics,
            history: history.history
        };
    } catch (error) {
        console.error('训练流程出错:', error);
        throw error;
    }
}

// 创建模型函数
function createModel(params) {
    const model = tf.sequential();
    
    // 输入层 - 现在有23个特征（1个区域编码 + 22个其他特征）
    model.add(tf.layers.dense({
        inputShape: [23], // 23个特征
        units: params.hiddenUnits || 64,
        activation: params.activation || 'relu',
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })  // 添加L2正则化
    }));
    
    // 添加Dropout层防止过拟合
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    // 隐藏层
    const hiddenLayers = params.hiddenLayers || 2;
    for (let i = 1; i < hiddenLayers; i++) {
        model.add(tf.layers.dense({
            units: params.hiddenUnits || 64,
            activation: params.activation || 'relu',
            kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })  // 添加L2正则化
        }));
        
        // 每个隐藏层后添加Dropout
        model.add(tf.layers.dropout({ rate: 0.2 }));
    }
    
    // 输出层
    model.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
    }));
    
    // 编译模型
    model.compile({
        optimizer: tf.train.adam(params.learningRate || 0.001),
        loss: 'meanSquaredError',
        metrics: ['mae']
    });
    
    return model;
}

// 评估模型函数
async function evaluateModelWithTestData(model, testFeatures, testTargets) {
    try {
        // 转换为张量
        const testX = tf.tensor2d(testFeatures);
        const testY = tf.tensor2d(testTargets.map(t => [t]));
        
        // 进行预测
        const predictions = model.predict(testX);
        const predValues = await predictions.data();
        
        // 计算评估指标
        const mse = tf.mean(tf.square(tf.sub(testY, predictions))).dataSync()[0];
        const mae = tf.mean(tf.abs(tf.sub(testY, predictions))).dataSync()[0];
        
        // 计算RMSE
        const rmse = Math.sqrt(mse);
        
        // 计算R²
        const yMean = tf.mean(testY).dataSync()[0];
        const totalSumSquares = tf.sum(tf.square(tf.sub(testY, yMean))).dataSync()[0];
        const residualSumSquares = tf.sum(tf.square(tf.sub(testY, predictions))).dataSync()[0];
        const r2 = 1 - (residualSumSquares / totalSumSquares);
        
        // 清理内存
        testX.dispose();
        testY.dispose();
        predictions.dispose();
        
        return {
            mse,
            mae,
            rmse,
            r2,
            predictions: Array.from(predValues)
        };
    } catch (error) {
        console.error('评估模型时出错:', error);
        throw error;
    }
}

// 归一化输入特征的函数
function normalizeInputFeatures(features, data) {
    if (!data || !data.normalizationParams) {
        return features; // 如果没有归一化参数，返回原始特征
    }
    
    const { means, stds } = data.normalizationParams;
    
    // 确保特征数组有23个元素，与preprocessData函数一致
    if (features.length !== 23) {
        console.warn(`警告: 输入特征数量(${features.length})与预期(23)不匹配`);
    }
    
    return features.map((value, i) => {
        // 区域编码不进行归一化（索引0）
        if (i === 0) {
            return value;
        }
        
        // 其他特征使用对应的归一化参数（索引减1，因为区域编码占用了索引0）
        const normIndex = i - 1;
        if (normIndex >= 0 && normIndex < means.length) {
            return (value - means[normIndex]) / stds[normIndex];
        }
        
        console.warn(`警告: 特征${i}缺少归一化参数`);
        return value;
    });
}

// 改进的评估函数
async function evaluateModel(model, testFeatures, testTargets) {
    try {
        // 转换为张量
        const testX = tf.tensor2d(testFeatures);
        const testY = tf.tensor2d(testTargets.map(t => [t]));
        
        // 进行预测
        const predictions = model.predict(testX);
        const predValues = await predictions.data();
        
        // 计算评估指标
        const mse = tf.mean(tf.square(tf.sub(testY, predictions))).dataSync()[0];
        const mae = tf.mean(tf.abs(tf.sub(testY, predictions))).dataSync()[0];
        
        // 计算RMSE
        const rmse = Math.sqrt(mse);
        
        // 计算R²
        const yMean = tf.mean(testY).dataSync()[0];
        const totalSumSquares = tf.sum(tf.square(tf.sub(testY, yMean))).dataSync()[0];
        const residualSumSquares = tf.sum(tf.square(tf.sub(testY, predictions))).dataSync()[0];
        const r2 = 1 - (residualSumSquares / totalSumSquares);
        
        // 清理内存
        testX.dispose();
        testY.dispose();
        predictions.dispose();
        
        return {
            mse,
            mae,
            rmse,
            r2,
            predictions: Array.from(predValues)
        };
    } catch (error) {
        console.error('评估模型时出错:', error);
        throw error;
    }
}

// 导出函数
window.DataProcessingUtils = {
    validateData,
    extractFeatures,
    normalizeFeatures,
    augmentData,
    improvedTrainModel,
    trainModel,
    createModel,
    evaluateModel,
    evaluateModelWithTestData,
    normalizeInputFeatures
};