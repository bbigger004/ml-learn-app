// 模型相关功能

// 创建神经网络模型
function createNeuralNetworkModel(params) {
    const model = tf.sequential();
    
    // 输入层
    model.add(tf.layers.dense({
        inputShape: [params.inputShape || 13], // 默认13个特征
        units: params.hiddenUnits || 64,
        activation: params.activation || 'relu',
        kernelInitializer: 'glorotUniform'
    }));
    
    // 添加dropout层防止过拟合
    if (params.dropout && params.dropout > 0) {
        model.add(tf.layers.dropout({
            rate: params.dropout
        }));
    }
    
    // 隐藏层
    const hiddenLayers = params.hiddenLayers || 2;
    for (let i = 1; i < hiddenLayers; i++) {
        model.add(tf.layers.dense({
            units: params.hiddenUnits || 64,
            activation: params.activation || 'relu',
            kernelInitializer: 'glorotUniform'
        }));
        
        // 每个隐藏层后添加dropout
        if (params.dropout && params.dropout > 0) {
            model.add(tf.layers.dropout({
                rate: params.dropout
            }));
        }
    }
    
    // 输出层
    model.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
    }));
    
    // 编译模型
    const optimizer = getOptimizer(params.optimizer || 'adam', params.learningRate || 0.01);
    
    model.compile({
        optimizer: optimizer,
        loss: params.lossFunction || 'meanSquaredError',
        metrics: ['mae']
    });
    
    return model;
}

// 获取优化器
function getOptimizer(optimizerType, learningRate) {
    switch (optimizerType) {
        case 'adam':
            return tf.train.adam(learningRate);
        case 'sgd':
            return tf.train.sgd(learningRate);
        case 'rmsprop':
            return tf.train.rmsprop(learningRate);
        case 'adagrad':
            return tf.train.adagrad(learningRate);
        default:
            return tf.train.adam(learningRate);
    }
}
// c
// 创建更高级的模型（可选）
function createAdvancedModel(params) {
    const model = tf.sequential();
    
    // 输入层
    model.add(tf.layers.dense({
        inputShape: [params.inputShape || 13],
        units: params.hiddenUnits || 128,
        activation: params.activation || 'relu',
        kernelInitializer: 'heNormal'
    }));
    
    // 批量归一化
    model.add(tf.layers.batchNormalization());
    
    // 第一个隐藏层块
    model.add(tf.layers.dense({
        units: params.hiddenUnits || 64,
        activation: params.activation || 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.batchNormalization());
    if (params.dropout && params.dropout > 0) {
        model.add(tf.layers.dropout({ rate: params.dropout }));
    }
    
    // 第二个隐藏层块
    model.add(tf.layers.dense({
        units: params.hiddenUnits / 2 || 32,
        activation: params.activation || 'relu',
        kernelInitializer: 'heNormal'
    }));
    model.add(tf.layers.batchNormalization());
    if (params.dropout && params.dropout > 0) {
        model.add(tf.layers.dropout({ rate: params.dropout }));
    }
    
    // 输出层
    model.add(tf.layers.dense({
        units: 1,
        activation: 'linear'
    }));
    
    // 编译模型
    const optimizer = getOptimizer(params.optimizer || 'adam', params.learningRate || 0.001);
    
    model.compile({
        optimizer: optimizer,
        loss: params.lossFunction || 'meanSquaredError',
        metrics: ['mae']
    });
    
    return model;
}

// 训练模型的高级配置
function getTrainingCallbacks(params) {
    return {
        onEpochEnd: (epoch, logs) => {
            // 可以在这里添加自定义逻辑
            if (params.onEpochEnd) {
                params.onEpochEnd(epoch, logs);
            }
        },
        onBatchEnd: (batch, logs) => {
            // 可以在这里添加自定义逻辑
            if (params.onBatchEnd) {
                params.onBatchEnd(batch, logs);
            }
        }
    };
}
// 
// 模型评估函数
async function evaluateModel(model, testData) {
    const testFeatures = tf.tensor2d(testData.features);
    const testTargets = tf.tensor2d(testData.targets.map(t => [t]));
    
    // 评估模型
    const evaluation = model.evaluate(testFeatures, testTargets);
    const loss = await evaluation[0].data();
    const mae = await evaluation[1].data();
    
    // 预测
    const predictions = model.predict(testFeatures);
    const predValues = await predictions.data();
    
    // 计算更多指标
    const actualValues = testData.targets;
    
    // MSE (均方误差)
    let mse = 0;
    for (let i = 0; i < actualValues.length; i++) {
        mse += Math.pow(actualValues[i] - predValues[i], 2);
    }
    mse /= actualValues.length;
    
    // MAE (平均绝对误差)
    let maeCalc = 0;
    for (let i = 0; i < actualValues.length; i++) {
        maeCalc += Math.abs(actualValues[i] - predValues[i]);
    }
    maeCalc /= actualValues.length;
    
    // RMSE (均方根误差)
    const rmse = Math.sqrt(mse);
    
    // R² (决定系数)
    const meanActual = actualValues.reduce((sum, val) => sum + val, 0) / actualValues.length;
    let totalSumSquares = 0;
    let residualSumSquares = 0;
    
    for (let i = 0; i < actualValues.length; i++) {
        totalSumSquares += Math.pow(actualValues[i] - meanActual, 2);
        residualSumSquares += Math.pow(actualValues[i] - predValues[i], 2);
    }
    
    const r2 = 1 - (residualSumSquares / totalSumSquares);
    
    // MAPE (平均绝对百分比误差)
    let mape = 0;
    for (let i = 0; i < actualValues.length; i++) {
        if (actualValues[i] !== 0) {
            mape += Math.abs((actualValues[i] - predValues[i]) / actualValues[i]);
        }
    }
    mape = (mape / actualValues.length) * 100; // 转换为百分比
    
    const metrics = {
        loss: loss[0],
        mae: mae[0],
        mse: mse,
        rmse: rmse,
        r2: r2,
        mape: mape
    };
    
    // 清理内存
    testFeatures.dispose();
    testTargets.dispose();
    predictions.dispose();
    
    return {
        metrics,
        predictions: Array.from(predValues)
    };
}

// 保存模型到本地文件系统
async function saveModelToFileSystem(model, modelName, normParams = null) {
    try {
        // 获取模型拓扑
        const topology = model.toJSON();
        
        // 获取权重数据
        const weightData = [];
        const weightSpecs = [];
        
        // 遍历模型的所有层，提取权重
        for (const layer of model.layers) {
            const weights = layer.getWeights();
            for (let i = 0; i < weights.length; i++) {
                const weight = weights[i];
                const weightDataArray = await weight.data();
                weightData.push(...weightDataArray);
                
                weightSpecs.push({
                    name: `${layer.name}_${i}`,
                    shape: weight.shape,
                    dtype: weight.dtype
                });
            }
        }
        
        // 将权重数据转换为Base64，使用分块处理避免参数过多
        const chunkSize = 0x8000; // 32KB chunks
        let binaryString = '';
        for (let i = 0; i < weightData.length; i += chunkSize) {
            const chunk = weightData[i, i + chunkSize];
            binaryString += String.fromCharCode.apply(null, chunk);
        }
        const weightDataBase64 = btoa(binaryString);
        
        console.log('权重数据大小:', weightData.length, '字节');
        console.log('Base64编码后大小:', weightDataBase64.length, '字符');
        
        // 发送到服务器
        const response = await fetch('/api/model/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                modelName,
                topology,
                weightSpecs,
                weightData: weightDataBase64,
                normParams
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            return { success: true, message: result.message, path: result.path };
        } else {
            return { success: false, message: result.message, error: result.error };
        }
    } catch (error) {
        console.error('保存模型时出错:', error);
        return { success: false, message: '模型保存失败', error };
    }
}

// 从本地文件系统加载模型
async function loadModelFromFileSystem(modelName) {
    try {
        console.log('开始加载模型:', modelName);
        
        // 从服务器获取模型数据
        const response = await fetch(`/api/model/load/${modelName}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('从服务器获取的模型数据:', result);
        
        if (!result.success) {
            return { success: false, message: result.message, error: result.error };
        }
        
        // 使用更健壮的Base64解码方法
        try {
            // 检查权重数据
            console.log('权重数据类型:', typeof result.weightData);
            console.log('权重数据长度:', result.weightData.length);
            
            // 使用fetch的内置Base64解码方法
            const binaryString = atob(result.weightData);
            console.log('解码后的二进制字符串长度:', binaryString.length);
            
            // 创建Uint8Array
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            
            console.log('权重数据解码成功，长度:', bytes.length);
            
            // 检查模型拓扑和权重规格
            console.log('模型拓扑:', result.topology);
            console.log('权重规格:', result.weightSpecs);
            
            // 尝试使用不同的方法加载模型
            let model;
            try {
                // 方法1：直接使用fromMemory
                model = await tf.loadLayersModel(
                    tf.io.fromMemory({
                        modelTopology: result.topology,
                        weightSpecs: result.weightSpecs[0].weights,
                        weightData: bytes.buffer
                    })
                );
                console.log('方法1：模型加载成功');
            } catch (error1) {
                console.error('方法1失败:', error1.message);
                
                try {
                    // 方法2：使用权重数据作为ArrayBuffer
                    const weightDataArray = new ArrayBuffer(bytes.length);
                    const weightDataView = new Uint8Array(weightDataArray);
                    for (let i = 0; i < bytes.length; i++) {
                        weightDataView[i] = bytes[i];
                    }
                    
                    model = await tf.loadLayersModel(
                        tf.io.fromMemory({
                            modelTopology: result.topology,
                            weightSpecs: result.weightSpecs[0].weights,
                            weightData: weightDataArray
                        })
                    );
                    console.log('方法2：模型加载成功');
                } catch (error2) {
                    console.error('方法2失败:', error2.message);
                    throw new Error(`所有加载方法都失败了: ${error1.message}, ${error2.message}`);
                }
            }
            
            return { 
                success: true, 
                model, 
                message: result.message,
                normParams: result.normParams
            };
        } catch (decodeError) {
            console.error('模型解码失败:', decodeError);
            throw new Error(`模型解码失败: ${decodeError.message}`);
        }
    } catch (error) {
        console.error('加载模型时出错:', error);
        return { success: false, message: '模型加载失败', error: error.message };
    }
}

// 获取已保存的模型列表
async function getSavedModels() {
    try {
        const response = await fetch('/api/models');
        const result = await response.json();
        
        if (result.success) {
            return { success: true, models: result.models };
        } else {
            return { success: false, message: result.message, error: result.error };
        }
    } catch (error) {
        console.error('获取模型列表时出错:', error);
        return { success: false, message: '获取模型列表失败', error };
    }
}

// 删除模型
async function deleteModel(modelName) {
    try {
        const response = await fetch(`/api/model/${modelName}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            return { success: true, message: result.message };
        } else {
            return { success: false, message: result.message, error: result.error };
        }
    } catch (error) {
        console.error('删除模型时出错:', error);
        return { success: false, message: '删除模型失败', error };
    }
}

// 下载模型为文件
async function downloadModel(model, modelName = 'charging-prediction-model') {
    try {
        await model.save(`downloads://${modelName}`);
        return { success: true, message: '模型下载成功' };
    } catch (error) {
        console.error('下载模型时出错:', error);
        return { success: false, message: '模型下载失败', error };
    }
}

// 从文件上传加载模型
async function loadModelFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const modelJSON = event.target.result;
                const model = await tf.loadLayersModel(tf.io.browserFiles([file]));
                resolve({ success: true, model, message: '模型加载成功' });
            } catch (error) {
                reject({ success: false, message: '模型加载失败', error });
            }
        };
        
        reader.onerror = () => {
            reject({ success: false, message: '文件读取失败' });
        };
        
        reader.readAsText(file);
    });
}

// 导出模型架构和权重
function exportModelInfo(model) {
    const modelSummary = [];
    
    // 获取模型架构
    model.layers.forEach((layer, index) => {
        const layerInfo = {
            index,
            name: layer.name,
            className: layer.getClassName(),
            inputShape: layer.inputShape,
            outputShape: layer.outputShape,
            countParams: layer.countParams()
        };
        
        // 获取特定层的配置
        if (layer.getClassName() === 'Dense') {
            layerInfo.config = {
                units: layer.units,
                activation: layer.activation,
                useBias: layer.useBias
            };
        } else if (layer.getClassName() === 'Dropout') {
            layerInfo.config = {
                rate: layer.rate
            };
        }
        
        modelSummary.push(layerInfo);
    });
    
    // 计算总参数数
    const totalParams = model.countParams();
    
    return {
        architecture: modelSummary,
        totalParams,
        inputShape: model.inputs[0].shape,
        outputShape: model.outputs[0].shape
    };
}

// 创建自定义训练循环（高级用法）
async function customTrainingLoop(model, trainData, validationData, params) {
    const { features: trainFeatures, targets: trainTargets } = trainData;
    const { features: valFeatures, targets: valTargets } = validationData;
    
    const batchSize = params.batchSize || 32;
    const epochs = params.epochs || 50;
    const learningRate = params.learningRate || 0.01;
    
    // 转换为张量
    const trainX = tf.tensor2d(trainFeatures);
    const trainY = tf.tensor2d(trainTargets.map(t => [t]));
    const valX = tf.tensor2d(valFeatures);
    const valY = tf.tensor2d(valTargets.map(t => [t]));
    
    // 训练历史
    const history = {
        loss: [],
        valLoss: []
    };
    
    // 自定义训练循环
    for (let epoch = 0; epoch < epochs; epoch++) {
        // 训练一个epoch
        const historyEpoch = await model.fit(trainX, trainY, {
            batchSize,
            epochs: 1,
            validationData: [valX, valY],
            verbose: 0
        });
        
        // 记录历史
        history.loss.push(historyEpoch.history.loss[0]);
        history.valLoss.push(historyEpoch.history.val_loss[0]);
        
        // 调用回调函数
        if (params.onEpochEnd) {
            params.onEpochEnd(epoch, {
                loss: historyEpoch.history.loss[0],
                val_loss: historyEpoch.history.val_loss[0]
            });
        }
    }
    
    // 清理内存
    trainX.dispose();
    trainY.dispose();
    valX.dispose();
    valY.dispose();
    
    return history;
}

// 模型微调
async function fineTuneModel(model, newTrainData, params) {
    // 冻结部分层（可选）
    if (params.freezeLayers && params.freezeLayers > 0) {
        for (let i = 0; i < Math.min(params.freezeLayers, model.layers.length); i++) {
            model.layers[i].trainable = false;
        }
    }
    
    // 重新编译模型（使用较低的学习率进行微调）
    const fineTuneLearningRate = params.fineTuneLearningRate || (params.learningRate / 10);
    const optimizer = getOptimizer(params.optimizer || 'adam', fineTuneLearningRate);
    
    model.compile({
        optimizer: optimizer,
        loss: params.lossFunction || 'meanSquaredError',
        metrics: ['mae']
    });
    
    // 准备新训练数据
    const { features: trainFeatures, targets: trainTargets } = newTrainData;
    const trainX = tf.tensor2d(trainFeatures);
    const trainY = tf.tensor2d(trainTargets.map(t => [t]));
    
    // 微调训练
    const fineTuneHistory = await model.fit(trainX, trainY, {
        epochs: params.fineTuneEpochs || 10,
        batchSize: params.batchSize || 32,
        verbose: 1
    });
    
    // 清理内存
    trainX.dispose();
    trainY.dispose();
    
    return fineTuneHistory;
}

// 导出所有函数
window.ModelUtils = {
    createNeuralNetworkModel,
    createAdvancedModel,
    getOptimizer,
    getTrainingCallbacks,
    evaluateModel,
    saveModelToFileSystem,
    loadModelFromFileSystem,
    getSavedModels,
    deleteModel,
    downloadModel,
    loadModelFromFile,
    exportModelInfo,
    customTrainingLoop,
    fineTuneModel
};