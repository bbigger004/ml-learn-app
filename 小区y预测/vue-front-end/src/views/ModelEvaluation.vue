<template>
  <div class="model-evaluation-container">
    <el-card shadow="hover" class="main-card">
      <template #header>
        <div class="card-header">
          <span>模型评估与可视化</span>
        </div>
      </template>

      <!-- 模型选择 -->
      <el-row :gutter="20" class="mb-4">
        <el-col :span="8">
          <el-select v-model="selectedModelId" placeholder="选择模型" @change="onModelChange">
            <el-option
              v-for="model in modelList"
              :key="model.id"
              :label="model.name || model.id"
              :value="model.id"
            ></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-select v-model="lookback" placeholder="选择回看窗口">
            <el-option label="3" :value="3"></el-option>
            <el-option label="6" :value="6"></el-option>
            <el-option label="12" :value="12"></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-button type="primary" @click="evaluateSelectedModel">评估模型</el-button>
        </el-col>
      </el-row>

      <!-- 评估指标 -->
      <el-row :gutter="20" class="metrics-row mb-6" v-if="evaluationResult">
        <el-col :span="6" v-for="(metric, key) in evaluationResult.metrics" :key="key">
          <el-statistic :title="getMetricName(key)" :value="getMetricValue(metric)" :precision="4" />
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <div class="charts-container">
        <!-- 预测vs实际值 -->
        <el-card shadow="hover" class="chart-card mb-6">
          <template #header>
            <div class="chart-header">
              <span>预测值 vs 实际值</span>
            </div>
          </template>
          <div class="chart-wrapper">
            <canvas id="predictionChart"></canvas>
          </div>
        </el-card>

        <!-- 残差分析 -->
        <el-card shadow="hover" class="chart-card mb-6">
          <template #header>
            <div class="chart-header">
              <span>残差分析</span>
            </div>
          </template>
          <div class="chart-wrapper">
            <canvas id="residualChart"></canvas>
          </div>
        </el-card>

        <!-- 特征重要性 -->
        <el-card shadow="hover" class="chart-card mb-6">
          <template #header>
            <div class="chart-header">
              <span>特征重要性</span>
            </div>
          </template>
          <div class="chart-wrapper">
            <canvas id="featureImportanceChart"></canvas>
          </div>
        </el-card>
      </div>

      <!-- 模型比较 -->
      <el-card shadow="hover" class="comparison-card">
        <template #header>
          <div class="card-header">
            <span>模型比较</span>
          </div>
        </template>
        
        <div class="comparison-controls">
          <el-checkbox-group v-model="selectedModelsForComparison">
            <el-checkbox v-for="model in modelList" :key="model.id" :label="model.id">
              {{ model.name || model.id }}
            </el-checkbox>
          </el-checkbox-group>
          <el-button type="primary" @click="compareModels" :disabled="selectedModelsForComparison.length < 2">
            比较选中模型
          </el-button>
        </div>

        <!-- 模型比较结果 -->
        <div v-if="comparisonResult" class="comparison-result">
          <el-table :data="comparisonTableData" style="width: 100%">
            <el-table-column prop="modelId" label="模型ID" width="200"></el-table-column>
            <el-table-column prop="mse" label="MSE" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="mae" label="MAE" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="rmse" label="RMSE" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="r2" label="R²" width="120" show-overflow-tooltip></el-table-column>
            <el-table-column prop="best" label="最佳指标" width="150">
              <template #default="scope">
                <el-tag v-for="metric in scope.row.bestMetrics" :key="metric" size="small" type="success">
                  {{ getMetricName(metric) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="chart-wrapper mt-6">
            <canvas id="comparisonChart"></canvas>
          </div>
        </div>
      </el-card>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import predictionService from '../services/prediction.service';
import Chart from 'chart.js/auto';
import 'chartjs-plugin-datalabels';

export default {
  name: 'ModelEvaluation',
  setup() {
    // 数据状态
    const selectedModelId = ref('');
    const lookback = ref(6);
    const modelList = ref([]);
    const evaluationResult = ref(null);
    const comparisonResult = ref(null);
    const selectedModelsForComparison = ref([]);
    
    // 图表实例
    let predictionChart = null;
    let residualChart = null;
    let featureImportanceChart = null;
    let comparisonChart = null;

    // 获取模型列表
    const fetchModelList = async () => {
      try {
        // 模拟数据 - 实际应该从后端获取
        modelList.value = [
          { id: 'model-2024-01-01-000001', name: 'LSTM模型' },
          { id: 'model-2024-01-02-000002', name: 'GRU模型' },
          { id: 'model-2024-01-03-000003', name: 'CNN-LSTM模型' },
          { id: 'model-2024-01-04-000004', name: 'MLP模型' }
        ];
        if (modelList.value.length > 0) {
          selectedModelId.value = modelList.value[0].id;
        }
      } catch (error) {
        console.error('获取模型列表失败:', error);
      }
    };

    // 评估选定的模型
    const evaluateSelectedModel = async () => {
      try {
        const features = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11', 'x12'];
        const target = 'y';
        
        const result = await predictionService.evaluateModel(
          selectedModelId.value,
          features,
          target,
          lookback.value
        );
        
        evaluationResult.value = result;
        await nextTick();
        updateCharts();
      } catch (error) {
        console.error('评估模型失败:', error);
      }
    };

    // 模型变更处理
    const onModelChange = () => {
      evaluationResult.value = null;
      cleanupCharts();
    };

    // 比较模型
    const compareModels = async () => {
      try {
        const features = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7', 'x8', 'x9', 'x10', 'x11', 'x12'];
        const target = 'y';
        
        const result = await predictionService.compareModels(
          selectedModelsForComparison.value,
          features,
          target,
          lookback.value
        );
        
        comparisonResult.value = result;
        await nextTick();
        updateComparisonChart();
      } catch (error) {
        console.error('比较模型失败:', error);
      }
    };

    // 获取指标名称
    const getMetricName = (metricKey) => {
      const metricNames = {
        mse: '均方误差 (MSE)',
        mae: '平均绝对误差 (MAE)',
        rmse: '均方根误差 (RMSE)',
        r2: '决定系数 (R²)',
        mape: '平均绝对百分比误差 (MAPE)'
      };
      return metricNames[metricKey] || metricKey;
    };

    // 获取指标值
    const getMetricValue = (metric) => {
      if (typeof metric === 'number') {
        return metric;
      }
      return parseFloat(metric);
    };

    // 获取比较表格数据
    const comparisonTableData = ref([]);
    
    // 更新所有图表
    const updateCharts = () => {
      // 创建模拟数据（实际应用中应该使用evaluationResult中的真实数据）
      const actualData = [100, 105, 110, 115, 120, 125, 130, 135, 140, 145];
      const predictedData = [98, 106, 112, 113, 122, 124, 132, 133, 142, 144];
      const residuals = actualData.map((actual, index) => actual - predictedData[index]);
      const featureImportance = {
        'x1': 0.15,
        'x2': 0.22,
        'x3': 0.08,
        'x4': 0.12,
        'x5': 0.18,
        'x6': 0.05,
        'x7': 0.07,
        'x8': 0.03,
        'x9': 0.04,
        'x10': 0.02,
        'x11': 0.02,
        'x12': 0.02
      };

      // 更新预测vs实际值图表
      updatePredictionChart(actualData, predictedData);
      
      // 更新残差图表
      updateResidualChart(residuals);
      
      // 更新特征重要性图表
      updateFeatureImportanceChart(featureImportance);
    };

    // 更新预测vs实际值图表
    const updatePredictionChart = (actualData, predictedData) => {
      const ctx = document.getElementById('predictionChart');
      if (!ctx) return;

      if (predictionChart) {
        predictionChart.destroy();
      }

      predictionChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: Array.from({ length: actualData.length }, (_, i) => `样本 ${i+1}`),
          datasets: [
            {
              label: '实际值',
              data: actualData,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderWidth: 2,
              tension: 0.1
            },
            {
              label: '预测值',
              data: predictedData,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderWidth: 2,
              tension: 0.1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '模型预测效果'
            },
            legend: {
              position: 'top'
            }
          },
          scales: {
            y: {
              beginAtZero: false,
              title: {
                display: true,
                text: '数值'
              }
            },
            x: {
              title: {
                display: true,
                text: '样本'
              }
            }
          }
        }
      });
    };

    // 更新残差图表
    const updateResidualChart = (residuals) => {
      const ctx = document.getElementById('residualChart');
      if (!ctx) return;

      if (residualChart) {
        residualChart.destroy();
      }

      residualChart = new Chart(ctx, {
        type: 'scatter',
        data: {
          datasets: [
            {
              label: '残差',
              data: residuals.map((residual, index) => ({
                x: index,
                y: residual
              })),
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
              borderColor: 'rgb(153, 102, 255)',
              pointRadius: 5
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '残差分布'
            }
          },
          scales: {
            y: {
              title: {
                display: true,
                text: '残差'
              }
            },
            x: {
              title: {
                display: true,
                text: '样本索引'
              }
            }
          }
        }
      });
    };

    // 更新特征重要性图表
    const updateFeatureImportanceChart = (featureImportance) => {
      const ctx = document.getElementById('featureImportanceChart');
      if (!ctx) return;

      if (featureImportanceChart) {
        featureImportanceChart.destroy();
      }

      // 按重要性排序
      const sortedFeatures = Object.entries(featureImportance)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8); // 只显示前8个特征

      featureImportanceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedFeatures.map(([feature]) => feature),
          datasets: [
            {
              label: '重要性分数',
              data: sortedFeatures.map(([, importance]) => importance),
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
              borderColor: 'rgb(54, 162, 235)',
              borderWidth: 1
            }
          ]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '特征重要性排名（前8）'
            }
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: '重要性'
              }
            }
          }
        }
      });
    };

    // 更新模型比较图表
    const updateComparisonChart = () => {
      if (!comparisonResult.value) return;
      
      const ctx = document.getElementById('comparisonChart');
      if (!ctx) return;

      if (comparisonChart) {
        comparisonChart.destroy();
      }

      // 准备比较数据（模拟数据）
      const modelIds = ['model-2024-01-01-000001', 'model-2024-01-02-000002', 'model-2024-01-03-000003'];
      const metrics = ['mse', 'mae', 'rmse', 'r2'];
      
      // 模拟各模型的指标值
      const modelMetrics = {
        'model-2024-01-01-000001': { mse: 12.5, mae: 3.1, rmse: 3.54, r2: 0.89 },
        'model-2024-01-02-000002': { mse: 10.2, mae: 2.8, rmse: 3.19, r2: 0.91 },
        'model-2024-01-03-000003': { mse: 15.8, mae: 3.7, rmse: 3.97, r2: 0.86 }
      };

      // 准备图表数据
      const datasets = metrics.map((metric, index) => {
        const colors = [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 205, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)'
        ];
        
        return {
          label: getMetricName(metric),
          data: modelIds.map(modelId => modelMetrics[modelId][metric]),
          backgroundColor: colors[index],
          borderColor: colors[index].replace('0.5', '1'),
          borderWidth: 1
        };
      });

      comparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: modelIds.map(id => `模型 ${id.slice(-6)}`),
          datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: '模型性能比较'
            },
            legend: {
              position: 'top'
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: '模型'
              }
            },
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: '指标值'
              }
            }
          }
        }
      });

      // 更新比较表格数据
      comparisonTableData.value = modelIds.map(modelId => {
        const metrics = modelMetrics[modelId];
        // 找出该模型的最佳指标
        const bestMetrics = [];
        if (metrics.mse === Math.min(...modelIds.map(id => modelMetrics[id].mse))) bestMetrics.push('mse');
        if (metrics.mae === Math.min(...modelIds.map(id => modelMetrics[id].mae))) bestMetrics.push('mae');
        if (metrics.rmse === Math.min(...modelIds.map(id => modelMetrics[id].rmse))) bestMetrics.push('rmse');
        if (metrics.r2 === Math.max(...modelIds.map(id => modelMetrics[id].r2))) bestMetrics.push('r2');
        
        return {
          modelId,
          ...metrics,
          bestMetrics
        };
      });
    };

    // 清理图表实例
    const cleanupCharts = () => {
      if (predictionChart) {
        predictionChart.destroy();
        predictionChart = null;
      }
      if (residualChart) {
        residualChart.destroy();
        residualChart = null;
      }
      if (featureImportanceChart) {
        featureImportanceChart.destroy();
        featureImportanceChart = null;
      }
      if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
      }
    };

    // 组件挂载
    onMounted(() => {
      fetchModelList();
    });

    // 组件卸载
    onUnmounted(() => {
      cleanupCharts();
    });

    return {
      selectedModelId,
      lookback,
      modelList,
      evaluationResult,
      comparisonResult,
      selectedModelsForComparison,
      comparisonTableData,
      evaluateSelectedModel,
      onModelChange,
      compareModels,
      getMetricName,
      getMetricValue
    };
  }
};
</script>

<style scoped>
.model-evaluation-container {
  padding: 20px;
}

.main-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metrics-row {
  margin-top: 20px;
}

.charts-container {
  margin-bottom: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-wrapper {
  height: 400px;
  position: relative;
}

.comparison-card {
  margin-bottom: 20px;
}

.comparison-controls {
  margin-bottom: 20px;
}

.comparison-result {
  margin-top: 20px;
}

.el-checkbox-group {
  margin-bottom: 10px;
}

.el-checkbox {
  margin-right: 15px;
  margin-bottom: 10px;
}
</style>