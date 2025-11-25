<template>
  <div class="data-upload">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">
            <el-icon><Upload /></el-icon>
            数据文件上传
          </span>
        </div>
      </template>

      <!-- 上传区域 -->
      <el-upload
        class="upload-area"
        drag
        :action="uploadAction"
        :before-upload="beforeUpload"
        :on-success="handleSuccess"
        :on-error="handleError"
        :show-file-list="false"
        accept=".csv"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将CSV文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传csv文件，且不超过10MB
          </div>
        </template>
      </el-upload>

      <!-- 上传结果 -->
      <div v-if="uploadResult" class="upload-result">
        <el-alert
          :title="uploadResult.success ? '上传成功' : '上传失败'"
          :type="uploadResult.success ? 'success' : 'error'"
          :description="uploadResult.message"
          show-icon
          closable
        />

        <div v-if="uploadResult.success && uploadResult.data" class="data-info">
          <el-descriptions title="数据信息" :column="2" border>
            <el-descriptions-item label="文件名">
              {{ uploadResult.data.filename }}
            </el-descriptions-item>
            <el-descriptions-item label="数据行数">
              {{ uploadResult.data.rowCount }}
            </el-descriptions-item>
            <el-descriptions-item label="列数">
              {{ uploadResult.data.columns.length }}
            </el-descriptions-item>
          </el-descriptions>

          <!-- 数据预览 -->
          <div class="data-preview">
            <h3>数据预览 (前10行)</h3>
            <el-table
              :data="uploadResult.data.preview"
              border
              style="width: 100%"
              max-height="300"
            >
              <el-table-column
                v-for="column in uploadResult.data.columns"
                :key="column"
                :prop="column"
                :label="column"
                min-width="120"
              />
            </el-table>
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button
          type="primary"
          :disabled="!uploadResult?.success"
          @click="$router.push('/feature-selection')"
        >
          下一步：特征选择
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

interface UploadResult {
  success: boolean
  message: string
  data?: {
    filename: string
    rowCount: number
    columns: string[]
    preview: any[]
  }
}

const uploadResult = ref<UploadResult | null>(null)

// 计算上传地址
const uploadAction = computed(() => {
  return 'http://localhost:3000/api/data/upload'
})

const beforeUpload = (file: File) => {
  const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')
  const isLt10M = file.size / 1024 / 1024 < 10

  if (!isCSV) {
    ElMessage.error('只能上传CSV格式的文件!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过10MB!')
    return false
  }
  return true
}

const handleSuccess = (response: any) => {
  uploadResult.value = response
  ElMessage.success('文件上传成功!')
}

const handleError = (error: Error) => {
  uploadResult.value = {
    success: false,
    message: error.message || '文件上传失败'
  }
  ElMessage.error('文件上传失败!')
}
</script>

<style scoped>
.data-upload {
  padding: 20px;
}

.upload-card {
  max-width: 1000px;
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

.upload-area {
  margin-bottom: 20px;
}

.upload-result {
  margin-top: 20px;
}

.data-info {
  margin-top: 20px;
}

.data-preview {
  margin-top: 20px;
}

.data-preview h3 {
  margin-bottom: 10px;
  color: #606266;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}
</style>