// 主应用文件
document.addEventListener("DOMContentLoaded", function () {
  // 全局变量
  let model = null;
  let data = null;
  let trainingData = null;
  let testData = null;
  let modelMetrics = {};
  let lossChart = null;
  let predictionChart = null;

  // DOM元素
  const elements = {
    dataFile: document.getElementById("dataFile"),
    loadDataBtn: document.getElementById("loadDataBtn"),
    trainModelBtn: document.getElementById("trainModelBtn"),
    saveModelBtn: document.getElementById("saveModelBtn"),
    loadModelBtn: document.getElementById("loadModelBtn"),
    predictBtn: document.getElementById("predictBtn"),
    randomTestBtn: document.getElementById("randomTestBtn"),
    batchTestBtn: document.getElementById("batchTestBtn"),
    resetParamsBtn: document.getElementById("resetParamsBtn"),
    modelStatus: document.getElementById("modelStatus"),
    trainingProgress: document.getElementById("trainingProgress"),
    epochInfo: document.getElementById("epochInfo"),
    predictionResult: document.getElementById("predictionResult"),
    featureInputs: document.getElementById("featureInputs"),
    modelMetrics: document.getElementById("modelMetrics"),

    // 参数控制
    learningRate: document.getElementById("learningRate"),
    epochs: document.getElementById("epochs"),
    batchSize: document.getElementById("batchSize"),
    hiddenUnits: document.getElementById("hiddenUnits"),
    hiddenLayers: document.getElementById("hiddenLayers"),
    activation: document.getElementById("activation"),
    optimizer: document.getElementById("optimizer"),

    // 参数值显示
    learningRateValue: document.getElementById("learningRateValue"),
    epochsValue: document.getElementById("epochsValue"),
    batchSizeValue: document.getElementById("batchSizeValue"),
    hiddenUnitsValue: document.getElementById("hiddenUnitsValue"),
    hiddenLayersValue: document.getElementById("hiddenLayersValue"),
  };

  // 初始化图表
  function initCharts() {
    // 确保Chart.js已加载
    if (typeof Chart === "undefined") {
      console.error("Chart.js未加载");
      return;
    }

    console.log("开始初始化图表...");

    // 损失图表
    const lossCanvas = document.getElementById("lossChart");
    if (!lossCanvas) {
      console.error("损失图表canvas元素不存在");
      return;
    }

    try {
      const lossCtx = lossCanvas.getContext("2d");
      lossChart = new Chart(lossCtx, {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "训练损失",
              data: [],
              borderColor: "#0d6efd",
              backgroundColor: "rgba(13, 110, 253, 0.1)",
              tension: 0.1,
            },
            {
              label: "验证损失",
              data: [],
              borderColor: "#198754",
              backgroundColor: "rgba(25, 135, 84, 0.1)",
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
          plugins: {
            title: {
              display: true,
              text: "模型训练损失",
            },
          },
        },
      });
      console.log("损失图表初始化成功");
    } catch (error) {
      console.error("初始化损失图表时出错:", error);
    }

    // 预测结果图表
    const predictionCanvas = document.getElementById("predictionChart");
    if (!predictionCanvas) {
      console.error("预测图表canvas元素不存在");
      return;
    }

    try {
      const predictionCtx = predictionCanvas.getContext("2d");
      predictionChart = new Chart(predictionCtx, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "实际值 vs 预测值",
              data: [],
              backgroundColor: "rgba(13, 110, 253, 0.5)",
              borderColor: "#0d6efd",
            },
            {
              label: "理想预测线",
              data: [],
              type: "line",
              borderColor: "#dc3545",
              borderDash: [5, 5],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: "实际值",
              },
            },
            y: {
              title: {
                display: true,
                text: "预测值",
              },
            },
          },
          plugins: {
            title: {
              display: true,
              text: "预测结果对比",
            },
          },
        },
      });
      console.log("预测图表初始化成功");
    } catch (error) {
      console.error("初始化预测图表时出错:", error);
    }

    // 检查图表对象是否正确创建
    if (lossChart && predictionChart) {
      console.log("所有图表初始化完成");
    } else {
      console.error("图表初始化不完整");
      console.log("lossChart存在:", !!lossChart);
      console.log("predictionChart存在:", !!predictionChart);
    }
  }

  // 更新模型状态
  function updateModelStatus(status, message) {
    elements.modelStatus.className = "model-status";

    switch (status) {
      case "ready":
        elements.modelStatus.classList.add("status-ready");
        break;
      case "training":
        elements.modelStatus.classList.add("status-training");
        break;
      case "error":
        elements.modelStatus.classList.add("status-error");
        break;
    }

    elements.modelStatus.textContent = `模型状态：${message}`;
  }

  // 更新参数值显示
  function updateParameterDisplays() {
    elements.learningRateValue.textContent = elements.learningRate.value;
    elements.epochsValue.textContent = elements.epochs.value;
    elements.batchSizeValue.textContent = elements.batchSize.value;
    elements.hiddenUnitsValue.textContent = elements.hiddenUnits.value;
    elements.hiddenLayersValue.textContent = elements.hiddenLayers.value;
  }

  // 获取当前模型参数
  function getModelParameters() {
    return {
      learningRate: parseFloat(elements.learningRate.value),
      epochs: parseInt(elements.epochs.value),
      batchSize: parseInt(elements.batchSize.value),
      hiddenUnits: parseInt(elements.hiddenUnits.value),
      hiddenLayers: parseInt(elements.hiddenLayers.value),
      activation: elements.activation.value,
      optimizer: elements.optimizer.value,
    };
  }

  // 重置参数为默认值
  function resetParameters() {
    elements.learningRate.value = 0.001; // 降低学习率，使训练更稳定
    elements.epochs.value = 100; // 增加轮次，但会使用早停
    elements.batchSize.value = 32;
    elements.hiddenUnits.value = 32; // 减少隐藏单元，降低模型复杂度
    elements.hiddenLayers.value = 2;
    elements.activation.value = "relu";
    elements.optimizer.value = "adam";
    updateParameterDisplays();
  }

  // 生成特征输入控件
  function generateFeatureInputs() {
    if (!data || !data.headers) return;

    elements.featureInputs.innerHTML = "";

    // 使用前13列作为特征（不包括y列）
    for (let i = 0; i < Math.min(13, data.headers.length - 1); i++) {
      const header = data.headers[i];
      const inputGroup = document.createElement("div");
      inputGroup.className = "feature-input";

      const label = document.createElement("label");
      label.setAttribute("for", `feature-${i}`);
      label.className = "form-label";
      label.textContent = header;

      const input = document.createElement("input");
      input.type = "number";
      input.className = "form-control";
      input.id = `feature-${i}`;
      input.placeholder = `输入${header}的值`;
      input.step = "any";

      inputGroup.appendChild(label);
      inputGroup.appendChild(input);
      elements.featureInputs.appendChild(inputGroup);
    }
  }

  // 从输入控件获取特征值
  function getFeatureValues() {
    const features = [];
    for (let i = 0; i < Math.min(13, data.headers.length - 1); i++) {
      const input = document.getElementById(`feature-${i}`);
      if (input) {
        features.push(parseFloat(input.value) || 0);
      }
    }
    return features;
  }

  // 更新模型指标显示
  function updateModelMetrics() {
    elements.modelMetrics.innerHTML = "";

    const metrics = [
      {
        name: "MSE",
        value: modelMetrics.mse ? modelMetrics.mse.toFixed(4) : "N/A",
      },
      {
        name: "MAE",
        value: modelMetrics.mae ? modelMetrics.mae.toFixed(4) : "N/A",
      },
      {
        name: "RMSE",
        value: modelMetrics.rmse ? modelMetrics.rmse.toFixed(4) : "N/A",
      },
      {
        name: "R²",
        value: modelMetrics.r2 ? modelMetrics.r2.toFixed(4) : "N/A",
      },
    ];

    metrics.forEach((metric) => {
      const metricCard = document.createElement("div");
      metricCard.className = "metric-card";

      const metricValue = document.createElement("div");
      metricValue.className = "metric-value";
      metricValue.textContent = metric.value;

      const metricLabel = document.createElement("div");
      metricLabel.className = "metric-label";
      metricLabel.textContent = metric.name;

      metricCard.appendChild(metricValue);
      metricCard.appendChild(metricLabel);
      elements.modelMetrics.appendChild(metricCard);
    });
  }

  // 事件监听器
  function setupEventListeners() {
    // 参数滑块事件
    elements.learningRate.addEventListener("input", updateParameterDisplays);
    elements.epochs.addEventListener("input", updateParameterDisplays);
    elements.batchSize.addEventListener("input", updateParameterDisplays);
    elements.hiddenUnits.addEventListener("input", updateParameterDisplays);
    elements.hiddenLayers.addEventListener("input", updateParameterDisplays);

    // 按钮事件
    elements.loadDataBtn.addEventListener("click", loadData);
    elements.trainModelBtn.addEventListener("click", trainModel);
    elements.saveModelBtn.addEventListener("click", saveModel);
    elements.loadModelBtn.addEventListener("click", loadModel);
    elements.predictBtn.addEventListener("click", makePrediction);
    elements.randomTestBtn.addEventListener("click", randomTest);
    elements.batchTestBtn.addEventListener("click", batchTest);
    elements.resetParamsBtn.addEventListener("click", resetParameters);

    // 添加未来预测按钮事件监听器
    const predictFutureBtn = document.getElementById("predictFutureBtn");
    if (predictFutureBtn) {
      predictFutureBtn.addEventListener("click", predictFutureRegionMonth);
    }
  }

  // 加载数据
  async function loadData() {
    const file = elements.dataFile.files[0];
    if (!file) {
      alert("请选择数据文件");
      return;
    }

    updateModelStatus("ready", "正在加载数据...");

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: function (results) {
        try {
          // 处理解析错误，只记录真正的错误
          if (results.errors && results.errors.length > 0) {
            // 过滤掉非关键错误（如字段格式错误）
            const criticalErrors = results.errors.filter(
              (error) =>
                error.type !== "Delimiter" && error.type !== "FieldMismatch"
            );

            if (criticalErrors.length > 0) {
              updateModelStatus("error", "数据加载失败");
              console.error(
                "解析错误:",
                criticalErrors.map(
                  (err) => `${err.type}: ${err.message || err.code}`
                )
              );
              return;
            }
          }

          // 检查是否有数据
          if (!results.data || results.data.length === 0) {
            updateModelStatus("error", "CSV文件为空或格式不正确");
            return;
          }

          // 转换为数组格式以使用我们的验证函数
          const headers = results.meta.fields;
          const dataArray = results.data.map((row) =>
            headers.map((header) => row[header])
          );

          // 先预处理数据，再验证
          // 获取所有唯一的小区ID
          const uniqueRegions = [
            ...new Set(results.data.map((row) => row["小区ID"])),
          ];
          const regionToIndex = {};
          uniqueRegions.forEach((region, index) => {
            regionToIndex[region] = index;
          });

          // 提取特征和目标变量
          const features = results.data.map((row) => {
            // 将行数据转换为数组格式
            const rowData = headers.map((header) => row[header]);

            // 添加区域编码作为第一个特征
            const regionIndex = regionToIndex[row["小区ID"]] || 0;

            // 使用改进的特征提取函数
            const extractedFeatures = DataProcessingUtils.extractFeatures(
              rowData,
              headers
            );

            // 将区域编码作为第一个特征
            return [regionIndex, ...extractedFeatures];
          });

          const targets = results.data.map((row) => {
            // y列是目标变量
            return parseFloat(row["y"]) || 0;
          });

          // 组合特征和目标值进行验证
          const combinedData = features.map((feature, index) => [
            ...feature,
            targets[index],
          ]);

          // 使用改进的数据验证函数
          let validCombinedData = combinedData;
          try {
            validCombinedData = DataProcessingUtils.validateData(combinedData);
          } catch (error) {
            // 如果验证失败，使用原始数据
            console.warn("数据验证失败，使用原始数据:", error.message);
            validCombinedData = combinedData;
          }

          // 分离特征和目标值
          const validFeatures = validCombinedData.map((row) =>
            row.slice(0, -1)
          );
          const validTargets = validCombinedData.map(
            (row) => row[row.length - 1]
          );

          // 使用改进的归一化函数
          const { normalizedFeatures, normParams } =
            DataProcessingUtils.normalizeFeatures(validFeatures);

          // 保存归一化参数和区域信息
          data = {
            headers: headers,
            rows: results.data,
            uniqueRegions: uniqueRegions,
            regionToIndex: regionToIndex,
            normalizationParams: normParams,
          };

          // 完成数据预处理
          preprocessData();

          // 生成特征输入控件
          generateFeatureInputs();

          // 启用相关按钮
          elements.trainModelBtn.disabled = false;
          elements.randomTestBtn.disabled = false;
          elements.batchTestBtn.disabled = false;

          updateModelStatus(
            "ready",
            `数据加载成功，共${data.rows.length}条记录`
          );
        } catch (error) {
          updateModelStatus("error", `数据处理失败: ${error.message}`);
          console.error("数据处理错误:", error);
        }
      },
    });
  }

  // 预处理数据
  function preprocessData() {
    try {
      if (!data || !data.rows) {
        throw new Error("数据未加载或格式不正确");
      }

      // 如果数据已经在loadData中预处理过，直接使用
      if (
        data.normalizationParams &&
        data.uniqueRegions &&
        data.regionToIndex
      ) {
        // 提取特征和目标变量
        const features = data.rows.map((row) => {
          // 将行数据转换为数组格式
          const rowData = data.headers.map((header) => row[header]);

          // 添加区域编码作为第一个特征
          const regionIndex = data.regionToIndex[row["小区ID"]] || 0;

          // 使用改进的特征提取函数
          const extractedFeatures = DataProcessingUtils.extractFeatures(
            rowData,
            data.headers
          );

          // 将区域编码作为第一个特征
          return [regionIndex, ...extractedFeatures];
        });

        const targets = data.rows.map((row) => {
          // y列是目标变量
          return parseFloat(row["y"]) || 0;
        });

        // 使用已有的归一化参数
        const { normalizedFeatures } = DataProcessingUtils.normalizeFeatures(
          features,
          data.normalizationParams
        );

        // 分割训练集和测试集 (80% 训练, 20% 测试)
        const splitIndex = Math.floor(normalizedFeatures.length * 0.8);

        trainingData = {
          features: normalizedFeatures.slice(0, splitIndex),
          targets: targets.slice(0, splitIndex),
        };

        testData = {
          features: normalizedFeatures.slice(splitIndex),
          targets: targets.slice(splitIndex),
        };

        console.log(
          `数据预处理完成，训练集: ${trainingData.features.length} 样本，测试集: ${testData.features.length} 样本`
        );
        return;
      }

      // 如果数据没有预处理过，执行原始逻辑
      // 获取所有唯一的小区ID
      const uniqueRegions = [
        ...new Set(data.rows.map((row) => row["小区ID"])),
      ];
      data.uniqueRegions = uniqueRegions;

      // 为小区ID创建编码
      const regionToIndex = {};
      uniqueRegions.forEach((region, index) => {
        regionToIndex[region] = index;
      });
      data.regionToIndex = regionToIndex;

      // 提取特征和目标变量
      const features = data.rows.map((row) => {
        // 将行数据转换为数组格式
        const rowData = data.headers.map((header) => row[header]);

        // 添加区域编码作为第一个特征
        const regionIndex = regionToIndex[row["小区ID"]] || 0;

        // 使用改进的特征提取函数
        const extractedFeatures = DataProcessingUtils.extractFeatures(
          rowData,
          data.headers
        );

        // 将区域编码作为第一个特征
        return [regionIndex, ...extractedFeatures];
      });

      const targets = data.rows.map((row) => {
        // y列是目标变量
        return parseFloat(row["y"]) || 0;
      });

      // 使用改进的归一化函数
      const { normalizedFeatures, normParams } =
        DataProcessingUtils.normalizeFeatures(features);

      // 保存归一化参数
      data.normalizationParams = normParams;

      // 分割训练集和测试集 (80% 训练, 20% 测试)
      const splitIndex = Math.floor(normalizedFeatures.length * 0.8);

      trainingData = {
        features: normalizedFeatures.slice(0, splitIndex),
        targets: targets.slice(0, splitIndex),
      };

      testData = {
        features: normalizedFeatures.slice(splitIndex),
        targets: targets.slice(splitIndex),
      };

      console.log(
        `数据预处理完成，训练集: ${trainingData.features.length} 样本，测试集: ${testData.features.length} 样本`
      );
    } catch (error) {
      console.error("数据预处理失败:", error);
      throw new Error(`数据预处理失败: ${error.message}`);
    }
  }

  // 归一化特征
  // 归一化特征函数 - 已弃用，使用DataProcessingUtils.normalizeFeatures替代
  function normalizeFeatures(features) {
    // 使用新的数据处理工具进行归一化
    const { normalizedFeatures } =
      DataProcessingUtils.normalizeFeatures(features);
    return normalizedFeatures;
  }

  // 数据增强函数 - 使用改进的数据处理工具
  function augmentData(features, targets, noiseLevel = 0.05) {
    // 使用新的数据处理工具进行数据增强
    return DataProcessingUtils.augmentData(features, targets, noiseLevel);
  }

  // 训练模型
  async function trainModel() {
    try {
      if (!trainingData) {
        updateModelStatus("error", "请先加载数据");
        return;
      }

      updateModelStatus("training", "正在训练模型...");
      elements.trainModelBtn.disabled = true;

      // 重置进度条
      elements.trainingProgress.style.width = "0%";
      elements.epochInfo.textContent = "开始训练...";

      const params = getModelParameters();

      // 使用改进的训练方法
      const result = await DataProcessingUtils.trainModel(
        trainingData.features,
        trainingData.targets,
        testData.features,
        testData.targets,
        params,
        {
          onEpochEnd: (epoch, logs) => {
            // 更新进度条
            const progress = ((epoch + 1) / params.epochs) * 100;
            elements.trainingProgress.style.width = `${progress}%`;
            elements.epochInfo.textContent = `轮次 ${epoch + 1}/${
              params.epochs
            } - 损失: ${logs.loss.toFixed(
              4
            )} - 验证损失: ${logs.val_loss.toFixed(4)}`;

            // 更新损失图表
            updateLossChart({
              loss: [logs.loss],
              valLoss: [logs.val_loss],
            });
          },
        }
      );

      // 保存模型和指标
      model = result.model;
      modelMetrics = result.metrics;

      // 更新指标显示
      updateModelMetrics();

      // 训练完成后自动评估模型并更新预测图表
      console.log("训练完成，开始评估模型...");
      await evaluateModel();

      elements.trainModelBtn.disabled = false;
      elements.saveModelBtn.disabled = false;
      elements.predictBtn.disabled = false;

      // 启用未来预测按钮
      const predictFutureBtn = document.getElementById("predictFutureBtn");
      if (predictFutureBtn) {
        predictFutureBtn.disabled = false;
      }

      updateModelStatus("ready", "模型训练完成");
    } catch (error) {
      console.error("训练模型失败:", error);
      updateModelStatus("error", `训练模型失败: ${error.message}`);
      elements.trainModelBtn.disabled = false;
    }
  }

  // 创建模型
  function createModel(params) {
    const model = tf.sequential();

    // 输入层 - 现在有23个特征（区域编码、月份、21个其他特征）
    model.add(
      tf.layers.dense({
        inputShape: [23], // 23个特征
        units: params.hiddenUnits,
        activation: params.activation,
        kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // 添加L2正则化
      })
    );

    // 添加Dropout层防止过拟合
    model.add(tf.layers.dropout({ rate: 0.2 }));

    // 隐藏层
    for (let i = 1; i < params.hiddenLayers; i++) {
      model.add(
        tf.layers.dense({
          units: params.hiddenUnits,
          activation: params.activation,
          kernelRegularizer: tf.regularizers.l2({ l2: 0.001 }), // 添加L2正则化
        })
      );

      // 每个隐藏层后添加Dropout
      model.add(tf.layers.dropout({ rate: 0.2 }));
    }

    // 输出层
    model.add(
      tf.layers.dense({
        units: 1,
        activation: "linear",
      })
    );

    // 编译模型
    model.compile({
      optimizer: tf.train.adam(params.learningRate),
      loss: "meanSquaredError",
      metrics: ["mae"],
    });

    return model;
  }

  // 更新损失图表
  function updateLossChart(history) {
    if (!lossChart) return;

    // 如果是单个epoch的数据，添加到现有图表
    if (history.loss.length === 1) {
      const currentEpoch = lossChart.data.labels.length;
      lossChart.data.labels.push(currentEpoch + 1);
      lossChart.data.datasets[0].data.push(history.loss[0]);
      lossChart.data.datasets[1].data.push(history.valLoss[0]);
    } else {
      // 如果是完整的训练历史，替换整个图表
      const epochs = Array.from(
        { length: history.loss.length },
        (_, i) => i + 1
      );
      lossChart.data.labels = epochs;
      lossChart.data.datasets[0].data = history.loss;
      lossChart.data.datasets[1].data = history.valLoss;
    }

    lossChart.update();
  }

  // 评估模型
  async function evaluateModel() {
    try {
      console.log("开始评估模型...");
      if (!model || !testData) {
        throw new Error("模型或测试数据不存在");
      }

      // 使用改进的评估方法
      console.log("调用DataProcessingUtils.evaluateModel...");
      const metrics = await DataProcessingUtils.evaluateModel(
        model,
        testData.features,
        testData.targets
      );

      console.log("评估结果:", metrics);
      modelMetrics = metrics;

      // 更新指标显示
      updateModelMetrics();

      // 更新预测图表
      console.log("准备更新预测图表...");
      console.log(
        "测试数据目标值数量:",
        testData.targets ? testData.targets.length : 0
      );
      console.log(
        "预测值数量:",
        metrics.predictions ? metrics.predictions.length : 0
      );

      updatePredictionChart(testData.targets, metrics.predictions);
    } catch (error) {
      console.error("评估模型失败:", error);
      updateModelStatus("error", `评估模型失败: ${error.message}`);
    }
  }

  // 更新预测图表
  function updatePredictionChart(actual, predicted) {
    try {
      console.log("开始更新预测图表...");
      console.log("实际值数量:", actual ? actual.length : 0);
      console.log("预测值数量:", predicted ? predicted.length : 0);

      // 检查canvas元素是否存在
      const canvasElement = document.getElementById("predictionChart");
      if (!canvasElement) {
        console.error("预测图表canvas元素不存在");
        return;
      }

      console.log(
        "Canvas元素存在，尺寸:",
        canvasElement.width,
        "x",
        canvasElement.height
      );

      // 检查predictionChart对象是否存在，如果不存在则重新创建
      if (!predictionChart) {
        console.log("重新创建预测图表");
        const predictionCtx = canvasElement.getContext("2d");
        predictionChart = new Chart(predictionCtx, {
          type: "scatter",
          data: {
            datasets: [
              {
                label: "实际值 vs 预测值",
                data: [],
                backgroundColor: "rgba(13, 110, 253, 0.5)",
                borderColor: "#0d6efd",
              },
              {
                label: "理想预测线",
                data: [],
                type: "line",
                borderColor: "#dc3545",
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                title: {
                  display: true,
                  text: "实际值",
                },
              },
              y: {
                title: {
                  display: true,
                  text: "预测值",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "预测结果对比",
              },
              legend: {
                display: true,
                position: "top",
              },
            },
            animation: {
              duration: 0, // 禁用动画
            },
          },
        });
        console.log(
          "预测图表创建成功，predictionChart对象:",
          !!predictionChart
        );
      }

      // 检查数据是否有效
      if (
        !actual ||
        !predicted ||
        actual.length === 0 ||
        predicted.length === 0
      ) {
        console.error("预测数据无效");
        return;
      }

      // 散点数据
      const scatterData = actual.map((val, i) => ({ x: val, y: predicted[i] }));

      // 理想预测线 (y=x)
      const minVal = Math.min(...actual, ...predicted);
      const maxVal = Math.max(...actual, ...predicted);
      const lineData = [
        { x: minVal, y: minVal },
        { x: maxVal, y: maxVal },
      ];

      console.log("散点数据点数量:", scatterData.length);
      console.log("理想预测线数据:", lineData);
      console.log(
        "更新前图表数据集数量:",
        predictionChart.data.datasets.length
      );

      // 更新图表数据
      predictionChart.data.datasets[0].data = scatterData;
      predictionChart.data.datasets[1].data = lineData;

      console.log("图表数据已更新，准备渲染");

      // 使用setTimeout确保DOM更新完成后再更新图表
      setTimeout(() => {
        try {
          if (predictionChart) {
            predictionChart.update("none"); // 使用'none'模式禁用动画
            console.log("预测图表更新成功");
          } else {
            console.error("图表更新前predictionChart对象已丢失");
          }
        } catch (updateError) {
          console.error("图表更新时出错:", updateError);
        }
      }, 100);
    } catch (error) {
      console.error("更新预测图表时出错:", error);
    }
  }

  // 保存模型
  async function saveModel() {
    if (!model) {
      updateModelStatus("error", "没有可保存的模型");
      return;
    }

    // 创建模型名称输入对话框
    const defaultName = `model-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}`;
    const dialog = document.createElement("div");
    dialog.className = "modal fade show";
    dialog.style.display = "block";
    dialog.style.backgroundColor = "rgba(0,0,0,0.5)";
    dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">保存模型</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="modelNameInput" class="form-label">模型名称</label>
                            <input type="text" class="form-control" id="modelNameInput" value="${defaultName}">
                            <div class="form-text">请输入模型名称，用于标识不同的模型版本</div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelSave">取消</button>
                        <button type="button" class="btn btn-primary" id="confirmSave">保存</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    // 添加事件监听器
    const cancelBtn = document.getElementById("cancelSave");
    const confirmBtn = document.getElementById("confirmSave");
    const closeBtn = dialog.querySelector(".btn-close");
    const nameInput = document.getElementById("modelNameInput");

    const closeModal = () => {
      document.body.removeChild(dialog);
    };

    cancelBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);

    // 确认保存按钮点击事件
    confirmBtn.addEventListener("click", async () => {
      const modelName = nameInput.value.trim();
      if (!modelName) {
        alert("请输入模型名称");
        return;
      }

      closeModal();
      updateModelStatus("ready", "正在保存模型...");

      try {
        // 使用新的文件系统保存方法
        const result = await ModelUtils.saveModelToFileSystem(
          model,
          modelName,
          data && data.normalizationParams ? data.normalizationParams : null
        );

        if (result.success) {
          updateModelStatus("ready", `模型保存成功: ${result.message}`);
          // 可选：刷新模型列表
          updateModelList();
        } else {
          updateModelStatus("error", `模型保存失败: ${result.message}`);
        }
      } catch (error) {
        updateModelStatus("error", "模型保存失败");
        console.error("保存模型时出错:", error);
      }
    });

    // 输入框回车事件
    nameInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        confirmBtn.click();
      }
    });

    // 自动聚焦到输入框
    nameInput.focus();
    nameInput.select();
  }

  // 更新模型列表
  async function updateModelList() {
    try {
      const modelsResult = await ModelUtils.getSavedModels();

      if (modelsResult.success && modelsResult.models.length > 0) {
        console.log("已保存的模型:", modelsResult.models);
        // 这里可以更新UI中的模型列表显示
        // 例如，可以在页面中添加一个模型列表区域
      } else {
        console.log("没有已保存的模型");
      }
    } catch (error) {
      console.error("获取模型列表时出错:", error);
    }
  }

  // 加载模型
  async function loadModel() {
    // 首先获取已保存的模型列表
    const modelsResult = await ModelUtils.getSavedModels();

    if (!modelsResult.success || modelsResult.models.length === 0) {
      updateModelStatus("error", "没有可用的已保存模型");
      return;
    }

    // 创建模型选择对话框
    const modelOptions = modelsResult.models
      .map(
        (m) =>
          `<option value="${m.name}">${m.name} (${new Date(
            m.modifiedAt
          ).toLocaleString()})</option>`
      )
      .join("");

    const dialog = document.createElement("div");
    dialog.className = "modal fade show";
    dialog.style.display = "block";
    dialog.style.backgroundColor = "rgba(0,0,0,0.5)";
    dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">选择要加载的模型</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <select class="form-select" id="modelSelect">
                            ${modelOptions}
                        </select>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelLoad">取消</button>
                        <button type="button" class="btn btn-primary" id="confirmLoad">加载</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    // 添加事件监听器
    const cancelBtn = document.getElementById("cancelLoad");
    const confirmBtn = document.getElementById("confirmLoad");
    const closeBtn = dialog.querySelector(".btn-close");

    const closeModal = () => {
      document.body.removeChild(dialog);
    };

    cancelBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);

    confirmBtn.addEventListener("click", async () => {
      const selectedModel = document.getElementById("modelSelect").value;
      closeModal();

      updateModelStatus("ready", "正在加载模型...");

      try {
        // 使用新的文件系统加载方法
        const result = await ModelUtils.loadModelFromFileSystem(selectedModel);

        if (result.success) {
          model = result.model;

          // 加载归一化参数（如果存在）
          if (result.normParams) {
            if (!data) data = {};
            data.normalizationParams = result.normParams;
          }

          elements.predictBtn.disabled = false;
          elements.saveModelBtn.disabled = false;

          // 启用未来预测按钮
          const predictFutureBtn = document.getElementById("predictFutureBtn");
          if (predictFutureBtn) {
            predictFutureBtn.disabled = false;
          }

          // 模型加载完成后，如果有测试数据，则评估模型并更新预测图表
          if (testData && testData.targets && testData.targets.length > 0) {
            console.log("模型加载完成，开始评估模型...");
            await evaluateModel();
          }

          updateModelStatus("ready", `模型加载成功: ${result.message}`);
        } else {
          updateModelStatus("error", `模型加载失败: ${result.message}`);
        }
      } catch (error) {
        updateModelStatus("error", "模型加载失败");
        console.error("加载模型时出错:", error);
      }
    });
  }

  // 预测未来某月某小区的y值
  async function predictFutureRegionMonth() {
    if (!model) {
      updateModelStatus("error", "请先训练或加载模型");
      return;
    }

    if (!data || !data.uniqueRegions || !data.regionToIndex) {
      updateModelStatus("error", "请先加载数据");
      return;
    }

    // 创建预测对话框
    const regionOptions = data.uniqueRegions
      .map((region) => `<option value="${region}">${region}</option>`)
      .join("");

    const monthOptions = Array.from(
      { length: 12 },
      (_, i) => `<option value="${i + 1}">${i + 1}月</option>`
    ).join("");

    const dialog = document.createElement("div");
    dialog.className = "modal fade show";
    dialog.style.display = "block";
    dialog.style.backgroundColor = "rgba(0,0,0,0.5)";
    dialog.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">预测未来某月某小区的y值</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="regionSelect" class="form-label">选择小区</label>
                            <select class="form-select" id="regionSelect">
                                ${regionOptions}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="monthSelect" class="form-label">选择月份</label>
                            <select class="form-select" id="monthSelect">
                                ${monthOptions}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="yearInput" class="form-label">输入年份</label>
                            <input type="number" class="form-control" id="yearInput" value="2024" min="2020" max="2030">
                        </div>
                        <div class="row">
                            <div class="col-md-6">
                                <label for="homeEV" class="form-label">居家电动车</label>
                                <input type="number" class="form-control" id="homeEV" value="50" min="0">
                            </div>
                            <div class="col-md-6">
                                <label for="residentEV" class="form-label">常驻电动车</label>
                                <input type="number" class="form-control" id="residentEV" value="30" min="0">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label for="homeCarApp" class="form-label">居家汽车app</label>
                                <input type="number" class="form-control" id="homeCarApp" value="40" min="0">
                            </div>
                            <div class="col-md-6">
                                <label for="residentCarApp" class="form-label">常驻汽车app</label>
                                <input type="number" class="form-control" id="residentCarApp" value="25" min="0">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label for="homeCarService" class="form-label">居家汽车服务</label>
                                <input type="number" class="form-control" id="homeCarService" value="20" min="0">
                            </div>
                            <div class="col-md-6">
                                <label for="residentCarService" class="form-label">常驻汽车服务</label>
                                <input type="number" class="form-control" id="residentCarService" value="15" min="0">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label for="evRatio" class="form-label">居家新能源车占比 (%)</label>
                                <input type="number" class="form-control" id="evRatio" value="30" min="0" max="100" step="0.1">
                            </div>
                            <div class="col-md-6">
                                <label for="evOwnerRatio" class="form-label">常驻新能源车占比 (%)</label>
                                <input type="number" class="form-control" id="evOwnerRatio" value="25" min="0" max="100" step="0.1">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label for="homeEVOwnerRatio" class="form-label">居家新能源车主比例 (%)</label>
                                <input type="number" class="form-control" id="homeEVOwnerRatio" value="20" min="0" max="100" step="0.1">
                            </div>
                            <div class="col-md-6">
                                <label for="residentEVOwnerRatio" class="form-label">常驻新能源车主比例 (%)</label>
                                <input type="number" class="form-control" id="residentEVOwnerRatio" value="15" min="0" max="100" step="0.1">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-6">
                                <label for="homeResidents" class="form-label">居家人数</label>
                                <input type="number" class="form-control" id="homeResidents" value="200" min="0">
                            </div>
                            <div class="col-md-6">
                                <label for="residentResidents" class="form-label">常驻人数</label>
                                <input type="number" class="form-control" id="residentResidents" value="150" min="0">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-4">
                                <label for="communityAge" class="form-label">小区年限</label>
                                <input type="number" class="form-control" id="communityAge" value="5" min="0">
                            </div>
                            <div class="col-md-4">
                                <label for="isOld" class="form-label">是否老旧小区</label>
                                <select class="form-select" id="isOld">
                                    <option value="0">否</option>
                                    <option value="1">是</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label for="isStagnant" class="form-label">是否增长停滞</label>
                                <select class="form-select" id="isStagnant">
                                    <option value="0">否</option>
                                    <option value="1">是</option>
                                </select>
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-4">
                                <label for="saturation" class="form-label">饱和度</label>
                                <input type="number" class="form-control" id="saturation" value="0.7" min="0" max="1" step="0.01">
                            </div>
                            <div class="col-md-4">
                                <label for="transformerCapacity" class="form-label">变压器容量</label>
                                <input type="number" class="form-control" id="transformerCapacity" value="100" min="0">
                            </div>
                            <div class="col-md-4">
                                <label for="transformerCount" class="form-label">变压器数量</label>
                                <input type="number" class="form-control" id="transformerCount" value="2" min="0">
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-md-4">
                                <label for="userCount" class="form-label">用户数量</label>
                                <input type="number" class="form-control" id="userCount" value="80" min="0">
                            </div>
                            <div class="col-md-4">
                                <label for="avgPrice" class="form-label">均价</label>
                                <input type="number" class="form-control" id="avgPrice" value="50000" min="0">
                            </div>
                            <div class="col-md-4">
                                <label for="buildYear" class="form-label">建成年份</label>
                                <input type="number" class="form-control" id="buildYear" value="2019" min="1990" max="2030">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" id="cancelPredict">取消</button>
                        <button type="button" class="btn btn-primary" id="confirmPredict">预测</button>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(dialog);

    // 添加事件监听器
    const cancelBtn = document.getElementById("cancelPredict");
    const confirmBtn = document.getElementById("confirmPredict");
    const closeBtn = dialog.querySelector(".btn-close");

    const closeModal = () => {
      document.body.removeChild(dialog);
    };

    cancelBtn.addEventListener("click", closeModal);
    closeBtn.addEventListener("click", closeModal);

    confirmBtn.addEventListener("click", async () => {
      // 获取输入值
      const region = document.getElementById("regionSelect").value;
      const month = parseInt(document.getElementById("monthSelect").value);
      const year = parseInt(document.getElementById("yearInput").value);

 
      const features = [
        data.regionToIndex[region] || 0, // 区域编码
        month, // 月份
        parseFloat(document.getElementById("homeEV").value) || 0, // 居家电动车
        parseFloat(document.getElementById("residentEV").value) || 0, // 常驻电动车
        parseFloat(document.getElementById("homeCarApp").value) || 0, // 居家汽车app
        parseFloat(document.getElementById("residentCarApp").value) || 0, // 常驻汽车app
        parseFloat(document.getElementById("homeCarService").value) || 0, // 居家汽车服务
        parseFloat(document.getElementById("residentCarService").value) || 0, // 常驻汽车服务
        parseFloat(document.getElementById("evRatio").value) / 100 || 0, // 居家新能源车占比
        parseFloat(document.getElementById("evOwnerRatio").value) / 100 || 0, // 常驻新能源车占比
        parseFloat(document.getElementById("homeEVOwnerRatio").value) / 100 ||
          0, // 居家新能源车主比例
        parseFloat(document.getElementById("residentEVOwnerRatio").value) /
          100 || 0, // 常驻新能源车主比例
        parseFloat(document.getElementById("homeResidents").value) || 0, // 居家人数
        parseFloat(document.getElementById("residentResidents").value) || 0, // 常驻人数
        parseFloat(document.getElementById("communityAge").value) || 0, // 小区年限
        parseInt(document.getElementById("isOld").value) || 0, // 是否老旧小区
        parseInt(document.getElementById("isStagnant").value) || 0, // 是否增长停滞
        parseFloat(document.getElementById("saturation").value) || 0, // 饱和度
        parseFloat(document.getElementById("transformerCapacity").value) || 0, // 变压器容量
        parseFloat(document.getElementById("transformerCount").value) || 0, // 变压器数量
        parseFloat(document.getElementById("userCount").value) || 0, // 用户数量
        parseFloat(document.getElementById("avgPrice").value) || 0, // 均价
        parseInt(document.getElementById("buildYear").value) || 2000, // 建成年份
      ];

      closeModal();

      // 归一化特征
      const normalizedFeatures = normalizeInputFeatures(features);

      // 进行预测
      const inputTensor = tf.tensor2d([normalizedFeatures]);
      const prediction = model.predict(inputTensor);
      const predictionValue = await prediction.data();

      // 显示预测结果
      const resultDiv = elements.predictionResult;
      resultDiv.style.display = "block";
      resultDiv.className = "prediction-result bg-primary text-white";
      resultDiv.innerHTML = `
                <h5>未来预测结果</h5>
                <p>小区: <strong>${region}</strong></p>
                <p>时间: <strong>${year}年${month}月</strong></p>
                <p>预测y值: <strong>${predictionValue[0].toFixed(
                  2
                )}</strong></p>
                <div class="mt-3">
                    <small>注意: 此预测基于当前模型和输入的特征值，实际结果可能因多种因素而有所不同。</small>
                </div>
            `;

      // 清理内存
      inputTensor.dispose();
      prediction.dispose();
    });
  }

  // 进行预测
  async function makePrediction() {
    if (!model) {
      updateModelStatus("error", "请先训练或加载模型");
      return;
    }

    const features = getFeatureValues();
    if (features.length === 0) {
      updateModelStatus("error", "请输入特征值");
      return;
    }

    // 归一化特征
    const normalizedFeatures = normalizeInputFeatures(features);

    // 进行预测
    const inputTensor = tf.tensor2d([normalizedFeatures]);
    const prediction = model.predict(inputTensor);
    const predictionValue = await prediction.data();

    // 显示预测结果
    const resultDiv = elements.predictionResult;
    resultDiv.style.display = "block";
    resultDiv.className = "prediction-result bg-info text-white";
    resultDiv.innerHTML = `
            <h5>预测结果</h5>
            <p>预测值 (y): <strong>${predictionValue[0].toFixed(2)}</strong></p>
            <p>输入特征: ${features.map((f) => f.toFixed(2)).join(", ")}</p>
        `;

    // 清理内存
    inputTensor.dispose();
    prediction.dispose();
  }

  // 归一化输入特征
  function normalizeInputFeatures(features) {
    // 使用数据处理修复函数中的归一化方法
    return DataProcessingUtils.normalizeInputFeatures(features, data);
  }

  // 随机测试
  async function randomTest() {
    if (!testData || testData.features.length === 0) {
      updateModelStatus("error", "没有可用的测试数据");
      return;
    }

    // 随机选择一个测试样本
    const randomIndex = Math.floor(Math.random() * testData.features.length);
    const testFeature = testData.features[randomIndex];
    const actualValue = testData.targets[randomIndex];

    // 进行预测
    const inputTensor = tf.tensor2d([testFeature]);
    const prediction = model.predict(inputTensor);
    const predictionValue = await prediction.data();

    console.log(testData);

    // 显示预测结果
    const resultDiv = elements.predictionResult;
    resultDiv.style.display = "block";
    resultDiv.className = "prediction-result bg-warning text-dark";
    resultDiv.innerHTML = `
            <h5>随机测试结果</h5>
            <p>实际值 (y): <strong>${actualValue.toFixed(2)}</strong></p>
            <p>预测值 (y): <strong>${predictionValue[0].toFixed(2)}</strong></p>
            <p>误差: <strong>${Math.abs(
              actualValue - predictionValue[0]
            ).toFixed(2)}</strong></p>
        `;

    // 清理内存
    inputTensor.dispose();
    prediction.dispose();
  }

  // 批量测试
  async function batchTest() {
    if (!testData || testData.features.length === 0) {
      updateModelStatus("error", "没有可用的测试数据");
      return;
    }

    // 随机选择10个测试样本
    const sampleSize = Math.min(10, testData.features.length);
    const indices = [];
    while (indices.length < sampleSize) {
      const index = Math.floor(Math.random() * testData.features.length);
      if (!indices.includes(index)) {
        indices.push(index);
      }
    }

    // 准备批量预测数据
    const batchFeatures = indices.map((i) => testData.features[i]);
    const batchTargets = indices.map((i) => testData.targets[i]);

    // 进行批量预测
    const inputTensor = tf.tensor2d(batchFeatures);
    const predictions = model.predict(inputTensor);
    const predictionValues = await predictions.data();

    // 计算平均误差
    let totalError = 0;
    indices.forEach((index, i) => {
      totalError += Math.abs(batchTargets[i] - predictionValues[i]);
    });
    const avgError = totalError / sampleSize;

    // 显示预测结果
    const resultDiv = elements.predictionResult;
    resultDiv.style.display = "block";
    resultDiv.className = "prediction-result bg-success text-white";
    resultDiv.innerHTML = `
            <h5>批量测试结果 (10个样本)</h5>
            <p>平均绝对误差: <strong>${avgError.toFixed(2)}</strong></p>
            <p>最大误差: <strong>${Math.max(
              ...indices.map((i, idx) =>
                Math.abs(batchTargets[idx] - predictionValues[idx])
              )
            ).toFixed(2)}</strong></p>
            <p>最小误差: <strong>${Math.min(
              ...indices.map((i, idx) =>
                Math.abs(batchTargets[idx] - predictionValues[idx])
              )
            ).toFixed(2)}</strong></p>
        `;

    // 清理内存
    inputTensor.dispose();
    predictions.dispose();
  }

  // 初始化应用
  function init() {
    initCharts();
    setupEventListeners();
    updateParameterDisplays();
    updateModelStatus("ready", "就绪，请加载数据开始");
  }

  // 启动应用
  init();
});
