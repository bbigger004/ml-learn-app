<template>
  <div class="feature-selection">
    <el-card class="selection-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><SetUp /></el-icon>
            特征选择
          </span>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>

      <!-- 特征选择区域 -->
      <div v-else-if="columns.length > 0" class="selection-content">
        <!-- 目标变量选择 -->
        <div class="target-selection">
          <h3>选择目标变量</h3>
          <el-select v-model="targetColumn" placeholder="请选择目标变量" style="width: 300px">
            <el-option
              v-for="column in numericColumns"
              :key="column"
              :label="column"
              :value="column"
            />
          </el-select>
        </div>

        <!-- 特征选择 -->
        <div class="feature-selection-area">
          <h3>选择特征变量</h3>
          <div class="feature-list">
            <el-checkbox-group v-model="selectedFeatures">
              <el-row :gutter="20">
                <el-col :span="8" v-for="column in availableFeatures" :key="column">
                  <el-checkbox :label="column">
                    {{ column }}
                    <el-tag
                      v-if="columnStats[column]"
                      :type="columnStats[column].type === 'numeric' ? 'success' : 'warning'"
                      size="small"
                    >
                      {{ columnStats[column].type === 'numeric' ? '数值' : '分类' }}
                    </el-tag>
                  </el-checkbox>
                </el-col>
              </el-row>
            </el-checkbox-group>
          </div>
        </div>

        <!-- 特征统计信息 -->
        <div class="feature-stats">
          <h3>特征统计信息</h3>
          <el-table :data="featureStatsTable" border style="width: 100%">
            <el-table-column prop="feature" label="特征" min-width="120" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="scope">
                <el-tag :type="scope.row.type === 'numeric' ? 'success' : 'warning'">
                  {{ scope.row.type === 'numeric' ? '数值' : '分类' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="uniqueCount" label="唯一值数量" width="120" />
            <el-table-column prop="sampleValues" label="示例值" min-width="200">
              <template #default="scope">
                <span>{{ scope.row.sampleValues.join(', ') }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <el-button @click="$router.push('/data-upload')">
            上一步
          </el-button>
          <el-button
            type="primary"
            :disabled="!canProceed"
            @click="handlePreprocess"
            :loading="preprocessing"
          >
            数据预处理
          </el-button>
          <el-button
            type="success"
            :disabled="!canProceed"
            @click="$router.push('/model-training')"
          >
            下一步：模型训练
          </el-button>
        </div>
      </div>

      <!-- 无数据提示 -->
      <div v-else class="no-data">
        <el-empty description="请先上传数据文件">
          <el-button type="primary" @click="$router.push('/data-upload')">
            前往数据上传
          </el-button>
        </el-empty>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

interface ColumnStats {
  [key: string]: {
    type: 'numeric' | 'categorical'
    uniqueCount: number
    sampleValues: any[]
  }
}

const loading = ref(false)
const preprocessing = ref(false)
const columns = ref<string[]>([])
const columnStats = ref<ColumnStats>({})
const selectedFeatures = ref<string[]>([])
const targetColumn = ref('y')

// 计算属性
const numericColumns = computed(() => {
  return columns.value.filter(col =>
    columnStats.value[col]?.type === 'numeric' && col !== '年月'
  )
})

const availableFeatures = computed(() => {
  return columns.value.filter(col => col !== targetColumn.value && col !== '年月')
})

const featureStatsTable = computed(() => {
  return columns.value.map(col => ({
    feature: col,
    type: columnStats.value[col]?.type || 'unknown',
    uniqueCount: columnStats.value[col]?.uniqueCount || 0,
    sampleValues: columnStats.value[col]?.sampleValues || []
  }))
})

const canProceed = computed(() => {
  return selectedFeatures.value.length > 0 && targetColumn.value
})

// 生命周期
onMounted(() => {
  loadColumns()
})

// 方法
const loadColumns = async () => {
  try {
    loading.value = true
    const response = await api.getColumns()
    if (response.success) {
      columns.value = response.data.columns
      columnStats.value = response.data.columnStats

      // 默认选择一些特征
      const defaultFeatures = ['小区年限', '饱和度', '用户数量', '均价', '变压器容量']
      selectedFeatures.value = defaultFeatures.filter(feature =>
        columns.value.includes(feature)
      )
    }
  } catch (error) {
    ElMessage.error('加载列信息失败')
  } finally {
    loading.value = false
  }
}

const handlePreprocess = async () => {
  try {
    preprocessing.value = true
    const response = await api.preprocessData({
      selectedFeatures: selectedFeatures.value,
      targetColumn: targetColumn.value
    })

    if (response.success) {
      ElMessage.success('数据预处理完成')
      // 这里可以保存预处理结果到store
    }
  } catch (error) {
    ElMessage.error('数据预处理失败')
  } finally {
    preprocessing.value = false
  }
}
</script>

<style scoped>
.feature-selection {
  padding: 20px;
}

.selection-card {
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

.loading-container {
  padding: 20px;
}

.selection-content {
  padding: 20px 0;
}

.target-selection {
  margin-bottom: 30px;
}

.target-selection h3,
.feature-selection-area h3,
.feature-stats h3 {
  margin-bottom: 15px;
  color: #606266;
  border-left: 4px solid #409eff;
  padding-left: 10px;
}

.feature-list {
  margin-bottom: 30px;
}

.feature-list .el-checkbox {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.feature-list .el-tag {
  margin-left: 8px;
}

.feature-stats {
  margin-bottom: 30px;
}

.action-buttons {
  text-align: center;
  margin-top: 30px;
}

.action-buttons .el-button {
  margin: 0 10px;
}

.no-data {
  padding: 40px 0;
  text-align: center;
}
</style>