const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 5000;  // 修改默认端口为5000

// 设置CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// 确保模型目录存在
const modelsDir = path.join('D:', 'Desktop', 'MY', 'TensorFlow机器学习', '小区充电桩预测', 'models');
if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
}

// 设置文件上传
const upload = multer({ dest: 'uploads/' });

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 设置静态文件目录
app.use(express.static(path.join(__dirname)));

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API路由示例 - 获取模型参数
app.get('/api/model/parameters', (req, res) => {
    // 这里可以返回模型的当前参数
    res.json({
        success: true,
        parameters: {
            learningRate: 0.01,
            epochs: 100,
            batchSize: 32,
            hiddenLayers: [64, 32],
            activation: 'relu',
            optimizer: 'adam'
        }
    });
});

// API路由示例 - 更新模型参数
app.post('/api/model/parameters', express.json(), (req, res) => {
    // 这里可以更新模型的参数
    const { learningRate, epochs, batchSize, hiddenLayers, activation, optimizer } = req.body;
    
    // 在实际应用中，这里会保存参数到数据库或文件
    console.log('更新模型参数:', { learningRate, epochs, batchSize, hiddenLayers, activation, optimizer });
    
    res.json({
        success: true,
        message: '模型参数已更新'
    });
});

// API路由 - 保存模型到本地文件系统
app.post('/api/model/save', express.json({ limit: '50mb' }), (req, res) => {
    try {
        const { modelName, modelData, topology, weightSpecs, weightData, normParams } = req.body;
        
        if (!modelName || !topology || !weightSpecs || !weightData) {
            return res.status(400).json({
                success: false,
                message: '缺少必要的模型数据'
            });
        }
        
        // 创建模型目录
        const modelDir = path.join(modelsDir, modelName);
        if (!fs.existsSync(modelDir)) {
            fs.mkdirSync(modelDir, { recursive: true });
        }
        
        // 保存模型拓扑
        fs.writeFileSync(
            path.join(modelDir, 'model.json'),
            JSON.stringify({ modelTopology: topology, weightsManifest: weightSpecs }),
            'utf8'
        );
        
        // 保存权重数据
        fs.writeFileSync(
            path.join(modelDir, 'weights.bin'),
            Buffer.from(weightData),
            'binary'
        );
        
        // 保存归一化参数（如果存在）
        if (normParams) {
            fs.writeFileSync(
                path.join(modelDir, 'norm-params.json'),
                JSON.stringify(normParams),
                'utf8'
            );
        }
        
        console.log(`模型已保存到: ${modelDir}`);
        
        res.json({
            success: true,
            message: `模型已保存到 ${modelDir}`,
            path: modelDir
        });
    } catch (error) {
        console.error('保存模型时出错:', error);
        res.status(500).json({
            success: false,
            message: '保存模型失败',
            error: error.message
        });
    }
});

// API路由 - 获取已保存的模型列表
app.get('/api/models', (req, res) => {
    try {
        const models = [];
        
        if (fs.existsSync(modelsDir)) {
            const modelFolders = fs.readdirSync(modelsDir).filter(file => {
                const filePath = path.join(modelsDir, file);
                return fs.statSync(filePath).isDirectory();
            });
            
            modelFolders.forEach(folder => {
                const modelDir = path.join(modelsDir, folder);
                const modelJsonPath = path.join(modelDir, 'model.json');
                const normParamsPath = path.join(modelDir, 'norm-params.json');
                
                if (fs.existsSync(modelJsonPath)) {
                    const stats = fs.statSync(modelJsonPath);
                    models.push({
                        name: folder,
                        path: modelDir,
                        createdAt: stats.birthtime,
                        modifiedAt: stats.mtime,
                        hasNormParams: fs.existsSync(normParamsPath)
                    });
                }
            });
        }
        
        res.json({
            success: true,
            models: models.sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt))
        });
    } catch (error) {
        console.error('获取模型列表时出错:', error);
        res.status(500).json({
            success: false,
            message: '获取模型列表失败',
            error: error.message
        });
    }
});

// API路由 - 加载模型
app.get('/api/model/load/:modelName', (req, res) => {
    try {
        const { modelName } = req.params;
        const modelDir = path.join(modelsDir, modelName);
        
        if (!fs.existsSync(modelDir)) {
            return res.status(404).json({
                success: false,
                message: `模型 ${modelName} 不存在`
            });
        }
        
        const modelJsonPath = path.join(modelDir, 'model.json');
        const weightsPath = path.join(modelDir, 'weights.bin');
        const normParamsPath = path.join(modelDir, 'norm-params.json');
        
        if (!fs.existsSync(modelJsonPath) || !fs.existsSync(weightsPath)) {
            return res.status(404).json({
                success: false,
                message: `模型文件不完整`
            });
        }
        
        // 读取模型拓扑
        const modelJson = JSON.parse(fs.readFileSync(modelJsonPath, 'utf8'));
        
        // 读取权重数据
        const weightData = fs.readFileSync(weightsPath);
        
        // 读取归一化参数（如果存在）
        let normParams = null;
        if (fs.existsSync(normParamsPath)) {
            normParams = JSON.parse(fs.readFileSync(normParamsPath, 'utf8'));
        }
        
        // 将权重数据转换为Base64，便于传输
        const weightDataBase64 = weightData.toString('base64');
        
        console.log(`模型已从 ${modelDir} 加载`);
        
        res.json({
            success: true,
            message: `模型已加载`,
            topology: modelJson.modelTopology,
            weightSpecs: modelJson.weightsManifest,
            weightData: weightDataBase64,
            normParams: normParams
        });
    } catch (error) {
        console.error('加载模型时出错:', error);
        res.status(500).json({
            success: false,
            message: '加载模型失败',
            error: error.message
        });
    }
});

// API路由 - 删除模型
app.delete('/api/model/:modelName', (req, res) => {
    try {
        const { modelName } = req.params;
        const modelDir = path.join(modelsDir, modelName);
        
        if (!fs.existsSync(modelDir)) {
            return res.status(404).json({
                success: false,
                message: `模型 ${modelName} 不存在`
            });
        }
        
        // 递归删除模型目录
        deleteFolderRecursive(modelDir);
        
        console.log(`模型 ${modelName} 已删除`);
        
        res.json({
            success: true,
            message: `模型 ${modelName} 已删除`
        });
    } catch (error) {
        console.error('删除模型时出错:', error);
        res.status(500).json({
            success: false,
            message: '删除模型失败',
            error: error.message
        });
    }
});

// 递归删除文件夹的辅助函数
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach((file, index) => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                // 递归删除子文件夹
                deleteFolderRecursive(curPath);
            } else {
                // 删除文件
                fs.unlinkSync(curPath);
            }
        });
        // 删除空文件夹
        fs.rmdirSync(folderPath);
    }
}

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});