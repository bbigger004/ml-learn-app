<template>
  <div class="model-training">
    <el-card class="training-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Cpu /></el-icon>
            模型训练
          </span>
        </div>
      </template>

      <!-- 训练配置 -->
      <div class="training-config">
        <h3>训练配置</h3>
        <el-form :model="trainingConfig" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="测试集比例">
                <el-slider
                  v-model="trainingConfig.testSize"
                  :min="0.1"
                  :max="0.5"
                  :step="0.05"
                  show-input
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="迭代次数">
                <el-input-number
                  v-model="trainingConfig.modelParams.n_estimators"
                  :min="50"
                  :max="500"
                  :step="50"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="最大深度">
                <el-input-number
                  v-model="trainingConfig.modelParams.max_depth"
                  :min="3"
                  :max="15"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="学习率">
                <el-slider
                  v-model="trainingConfig.modelParams.learning_rate"
                  :min="0.01"
                  :max="0.3"
                  :step="0.01"
                  show-input
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 训练按钮 -->
      <div class="training-action">
        <el-button
          type="primary"
          size="large"
          @click="startTraining"
          :loading="training"
          :disabled="!canTrain"
        >
          <el-icon v-if="!training"><VideoPlay /></el-icon>
          开始训练
        </el-button>
      </div>

      <!-- 训练进度 -->
      <div v-if="training" class="training-progress">
        <el-progress
          :percentage="progress"
          :status="progress === 100 ? 'success' : undefined"
          :show-text="false"
        />
        <div class="progress-text">
          训练中... {{ progress }}%
        </div>
      </div>

      <!-- 训练结果 -->
      <div v-if="trainingResult" class="training-result">
        <el-alert
          title="训练完成"
          type="success"
          :description="trainingResult.message"
          show-icon
          closable
        />

        <div class="result-details">
          <!-- 模型评估 -->
          <el-card class="evaluation-card">
            <template #header>
              <span class="card-subtitle">模型评估结果</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="模型ID">
                {{ trainingResult.data.modelId }}
              </el-descriptions-item>
              <el-descriptions-item label="训练时间">
                {{ trainingResult.data.trainingTime }}
              </el-descriptions-item>
              <el-descriptions-item label="均方误差 (MSE)">
                {{ trainingResult.data.evaluation.mse }}
              </el-descriptions-item>
              <el-descriptions-item label="均方根误差 (RMSE)">
                {{ trainingResult.data.evaluation.rmse }}
              </el-descriptions-item>
              <el-descriptions-item label="平均绝对误差 (MAE)">
                {{ trainingResult.data.evaluation.mae }}
              </el-descriptions-item>
              <el-descriptions-item label="决定系数 (R²)">
                {{ trainingResult.data.evaluation.r2 }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>

          <!-- 特征重要性 -->
          <el-card class="importance-card">
            <template #header>
              <span class="card-subtitle">特征重要性</span>
            </template>
            <el-table
              :data="trainingResult.data.featureImportance"
              border
              style="width: 100%"
            >
              <el-table-column prop="feature" label="特征" />
              <el-table-column prop="importance" label="重要性" width="120">
                <template #default="scope">
                  <el-progress
                    :percentage="scope.row.importance * 100"
                    :show-text="false"
                  />
                  <span style="margin-left: 10px">
                    {{ (scope.row.importance * 100).toFixed(2) }}%
                  </span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>

          <!-- 数据摘要 -->
          <el-card class="summary-card">
            <template #header>
              <span class="card-subtitle">数据摘要</span>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="总样本数">
                {{ trainingResult.data.dataSummary.totalSamples }}
              </el-descriptions-item>
              <el-descriptions-item label="训练样本数">
                {{ trainingResult.data.dataSummary.trainingSamples }}
              </el-descriptions-item>
              <el-descriptions-item label="测试样本数">
                {{ trainingResult.data.dataSummary.testSamples }}
              </el-descriptions-item>
              <el-descriptions-item label="特征数量">
                {{ trainingResult.data.dataSummary.featureCount }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button @click="$router.push('/feature-selection')">
          上一步
        </el-button>
        <el-button
          type="success"
          :disabled="!trainingResult"
          @click="$router.push('/prediction')"
        >
          下一步：预测结果
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

interface TrainingResult {
  success: boolean
  message: string
  data: {
    modelId: string
    trainingTime: string
    evaluation: {
      mse: number
      rmse: number
      mae: number
      r2: number
    }
    featureImportance: Array<{
      feature: string
      importance: number
    }>
    dataSummary: {
      totalSamples: number
      trainingSamples: number
      testSamples: number
      featureCount: number
    }
  }
}

const training = ref(false)
const progress = ref(0)
const trainingResult = ref<TrainingResult | null>(null)

const trainingConfig = reactive({
  testSize: 0.2,
  modelParams: {
    n_estimators: 100,
    max_depth: 6,
    learning_rate: 0.1
  }
})

const canTrain = computed(() => {
  // 这里可以添加更多的验证条件
  return true
})

const startTraining = async () => {
  try {
    training.value = true
    progress.value = 0

    // 模拟训练进度
    const progressInterval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += Math.random() * 10
      }
    }, 500)

    // 调用训练API
    const response = await api.trainModel({
      selectedFeatures: [
  "小区年限",
  "饱和度",
  "均价",
  "变压器容量",
  "是否增长停滞",
  "变压器数量",
  "建成年份",
  "是否老旧小区",
  "用户数量"
], // 这里应该从store获取
      targetColumn: 'y',
      testSize: trainingConfig.testSize,
      modelParams: trainingConfig.modelParams
    })

    clearInterval(progressInterval)
    progress.value = 100

    if (response.success) {
      trainingResult.value = response
      ElMessage.success('模型训练完成!')
    }
  } catch (error) {
    ElMessage.error('模型训练失败!')
  } finally {
    training.value = false
  }
}
</script>

<style scoped>
.model-training {
  padding: 20px;
}

.training-card {
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

.training-config {
  margin-bottom: 30px;
}

.training-config h3 {
  margin-bottom: 20px;
  color: #606266;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.training-action {
  text-align: center;
  margin-bottom: 30px;
}

.training-progress {
  margin-bottom: 30px;
  text-align: center;
}

.progress-text {
  margin-top: 10px;
  color: #606266;
}

.training-result {
  margin-bottom: 30px;
}

.result-details {
  margin-top: 20px;
}

.evaluation-card,
.importance-card,
.summary-card {
  margin-bottom: 20px;
}

.card-subtitle {
  font-weight: 600;
  color: #409eff;
}

.action-buttons {
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
}
</style>