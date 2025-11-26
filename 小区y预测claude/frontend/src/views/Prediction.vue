<template>
  <div class="prediction">
    <el-card class="prediction-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><DataAnalysis /></el-icon>
            预测结果
          </span>
        </div>
      </template>

      <!-- 预测配置 -->
      <div class="prediction-config">
        <h3>预测配置</h3>
        <el-form :model="predictionConfig" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="预测期数">
                <el-input-number
                  v-model="predictionConfig.periods"
                  :min="1"
                  :max="24"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="置信水平">
                <el-select v-model="predictionConfig.confidenceLevel" style="width: 100%">
                  <el-option label="90%" value="0.9" />
                  <el-option label="95%" value="0.95" />
                  <el-option label="99%" value="0.99" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item>
                <el-button
                  type="primary"
                  @click="generatePrediction"
                  :loading="predicting"
                  :disabled="!canPredict"
                >
                  生成预测
                </el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 预测结果 -->
      <div v-if="predictionResult" class="prediction-result">
        <!-- 时间序列图表 -->
        <el-card class="chart-card">
          <template #header>
            <span class="card-subtitle">预测趋势图</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>

        <!-- 预测数据表格 -->
        <el-card class="table-card">
          <template #header>
            <span class="card-subtitle">预测数据</span>
            <el-button type="primary" size="small" @click="exportData">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </template>
          <el-table
            :data="predictionTableData"
            border
            style="width: 100%"
            max-height="400"
          >
            <el-table-column prop="date" label="日期" width="100" />
            <el-table-column prop="value" label="预测值" width="120" />
            <el-table-column prop="confidence_lower" label="置信下限" width="120" />
            <el-table-column prop="confidence_upper" label="置信上限" width="120" />
            <el-table-column prop="confidence_interval" label="置信区间" width="150">
              <template #default="scope">
                [{{ scope.row.confidence_lower }}, {{ scope.row.confidence_upper }}]
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <!-- 关键指标 -->
        <el-card class="metrics-card">
          <template #header>
            <span class="card-subtitle">关键指标</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="metric-item">
                <div class="metric-value">
                  {{ predictionSummary.averagePrediction }}
                </div>
                <div class="metric-label">平均预测值</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <div class="metric-value">
                  {{ predictionSummary.maxPrediction }}
                </div>
                <div class="metric-label">最大预测值</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <div class="metric-value">
                  {{ predictionSummary.minPrediction }}
                </div>
                <div class="metric-label">最小预测值</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="metric-item">
                <div class="metric-value">
                  {{ predictionSummary.growthRate }}
                </div>
                <div class="metric-label">增长率</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>

      <!-- 无预测结果提示 -->
      <div v-else-if="!predicting" class="no-prediction">
        <el-empty description="请先进行预测">
          <el-button type="primary" @click="generatePrediction">
            生成预测
          </el-button>
        </el-empty>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="$router.push('/model-training')">
          上一步
        </el-button>
        <el-button type="success" @click="resetPrediction">
          重新预测
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import api from '@/services/api'

interface PredictionResult {
  success: boolean
  data: {
    predictions: Array<{
      date: string
      value: number
      confidence_lower: number
      confidence_upper: number
    }>
    historicalData: Array<{
      date: string
      value: number
    }>
    summary: {
      predictionPeriods: number
      lastHistoricalDate: string
      firstPredictionDate: string
      lastPredictionDate: string
    }
  }
}

const predicting = ref(false)
const predictionResult = ref<PredictionResult | null>(null)
const chartRef = ref<HTMLElement>()
let chart: echarts.ECharts | null = null

const predictionConfig = reactive({
  periods: 6,
  confidenceLevel: '0.95'
})

// 计算属性
const predictionTableData = computed(() => {
  if (!predictionResult.value) return []
  return predictionResult.value.data.predictions.map(pred => ({
    ...pred,
    confidence_interval: `${pred.confidence_lower.toFixed(2)} - ${pred.confidence_upper.toFixed(2)}`
  }))
})

const predictionSummary = computed(() => {
  if (!predictionResult.value) {
    return {
      averagePrediction: 0,
      maxPrediction: 0,
      minPrediction: 0,
      growthRate: '0%'
    }
  }

  const predictions = predictionResult.value.data.predictions
  const values = predictions.map(p => p.value)
  const average = values.reduce((a, b) => a + b, 0) / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)

  // 计算增长率
  const firstValue = predictions[0]?.value || 0
  const lastValue = predictions[predictions.length - 1]?.value || 0
  const growthRate = firstValue > 0 ? ((lastValue - firstValue) / firstValue * 100).toFixed(2) + '%' : '0%'

  return {
    averagePrediction: average.toFixed(2),
    maxPrediction: max.toFixed(2),
    minPrediction: min.toFixed(2),
    growthRate
  }
})

const canPredict = computed(() => {
  // 这里可以添加更多的验证条件
  return true
})

// 方法
const generatePrediction = async () => {
  try {
    predicting.value = true

    // 获取模型列表并选择最新的模型
    const modelListResponse = await api.getModelList()
    if (!modelListResponse.success || modelListResponse.data.models.length === 0) {
      ElMessage.error('没有可用的训练模型，请先训练模型')
      return
    }

    // 选择最新的模型（按创建时间排序）
    const latestModel = modelListResponse.data.models.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]

    const response = await api.predict({
      modelId: latestModel.modelId,
      periods: predictionConfig.periods
    })

    if (response.success) {
      predictionResult.value = response
      await nextTick()
      renderChart()
      ElMessage.success('预测生成成功!')
    }
  } catch (error) {
    ElMessage.error('预测生成失败!')
  } finally {
    predicting.value = false
  }
}

const renderChart = () => {
  if (!chartRef.value || !predictionResult.value) return

  // 销毁之前的图表
  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef.value)

  const { historicalData, predictions } = predictionResult.value.data

  // 准备图表数据
  const dates = [
    ...historicalData.map(d => d.date),
    ...predictions.map(p => p.date)
  ]

  const historicalValues = historicalData.map(d => d.value)
  const predictionValues = predictions.map(p => p.value)
  const lowerBounds = predictions.map(p => p.confidence_lower)
  const upperBounds = predictions.map(p => p.confidence_upper)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['历史数据', '预测值', '置信区间']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: {
      type: 'value',
      name: 'y值'
    },
    series: [
      {
        name: '历史数据',
        type: 'line',
        data: [...historicalValues, ...Array(predictions.length).fill(null)],
        itemStyle: {
          color: '#5470c6'
        },
        lineStyle: {
          width: 2
        }
      },
      {
        name: '预测值',
        type: 'line',
        data: [...Array(historicalData.length).fill(null), ...predictionValues],
        itemStyle: {
          color: '#91cc75'
        },
        lineStyle: {
          width: 2,
          type: 'dashed'
        }
      },
      {
        name: '置信区间',
        type: 'line',
        data: [...Array(historicalData.length).fill(null), ...upperBounds],
        lineStyle: {
          opacity: 0
        },
        stack: 'Confidence',
        symbol: 'none',
        areaStyle: {
          color: 'rgba(145, 204, 117, 0.3)'
        }
      },
      {
        name: '置信区间',
        type: 'line',
        data: [...Array(historicalData.length).fill(null), ...lowerBounds],
        lineStyle: {
          opacity: 0
        },
        stack: 'Confidence',
        symbol: 'none',
        areaStyle: {
          color: 'rgba(145, 204, 117, 0.3)'
        }
      }
    ]
  }

  chart.setOption(option)
}

const exportData = () => {
  if (!predictionResult.value) return

  const data = predictionResult.value.data.predictions
  const csvContent = [
    '日期,预测值,置信下限,置信上限',
    ...data.map(row =>
      `${row.date},${row.value},${row.confidence_lower},${row.confidence_upper}`
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `prediction_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

const resetPrediction = () => {
  predictionResult.value = null
  if (chart) {
    chart.dispose()
    chart = null
  }
}

// 生命周期
onMounted(() => {
  // 组件挂载时初始化
})

// 组件卸载时清理
import { onUnmounted } from 'vue'
onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})
</script>

<style scoped>
.prediction {
  padding: 20px;
}

.prediction-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  font-weight: 600;
}

.card-title .el-icon {
  margin-right: 8px;
  color: #409eff;
}

.prediction-config {
  margin-bottom: 30px;
}

.prediction-config h3 {
  margin-bottom: 20px;
  color: #606266;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.prediction-result {
  margin-bottom: 30px;
}

.chart-card,
.table-card,
.metrics-card {
  margin-bottom: 20px;
}

.card-subtitle {
  font-weight: 600;
  color: #409eff;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.metrics-card .el-row {
  text-align: center;
}

.metric-item {
  padding: 20px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.metric-label {
  color: #909399;
  font-size: 14px;
}

.action-buttons {
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
}

.no-prediction {
  padding: 40px 0;
  text-align: center;
}
</style>