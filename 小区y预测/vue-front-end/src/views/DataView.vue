<template>
  <div class="data-view-container">
    <el-card class="data-view-card">
      <template #header>
        <div class="card-header">
          <span>数据管理</span>
          <el-button type="primary" @click="handleUploadClick" icon="el-icon-upload">上传数据</el-button>
        </div>
      </template>

      <!-- 数据上传组件 -->
      <el-dialog
        title="上传数据集"
        :visible.sync="uploadVisible"
        width="500px"
        @close="resetUploadForm"
      >
        <el-form :model="uploadForm" ref="uploadFormRef" :rules="uploadRules">
          <el-form-item label="数据集名称" prop="name">
            <el-input v-model="uploadForm.name" placeholder="请输入数据集名称（可选）"></el-input>
          </el-form-item>
          <el-form-item label="上传文件" prop="file" required>
            <el-upload
              class="upload-demo"
              action=""
              :auto-upload="false"
              :file-list="fileList"
              :on-change="handleFileChange"
              accept=".csv"
              :limit="1"
              :on-exceed="handleExceed"
            >
              <el-button size="small" type="primary">选择文件</el-button>
              <div slot="tip" class="el-upload__tip">
                请上传CSV格式的数据集文件，最大支持10MB
              </div>
            </el-upload>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitUpload" :loading="uploadLoading">
              上传数据集
            </el-button>
            <el-button @click="uploadVisible = false">取消</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>

      <!-- 数据集列表 -->
      <div class="data-sets-section">
        <h3 class="section-title">数据集列表</h3>
        <el-table
          v-loading="loading"
          :data="dataSets"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55"></el-table-column>
          <el-table-column prop="id" label="ID" width="80"></el-table-column>
          <el-table-column prop="name" label="文件名" min-width="150"></el-table-column>
          <el-table-column prop="uploadedAt" label="上传时间" min-width="180">
            <template slot-scope="scope">
              {{ formatDate(scope.row.uploadedAt) }}
            </template>
          </el-table-column>
          <el-table-column prop="recordsCount" label="记录数" width="100"></el-table-column>
          <el-table-column prop="featuresCount" label="特征数" width="100"></el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template slot-scope="scope">
              <el-button size="small" @click="viewDataSample(scope.row)">查看样本</el-button>
              <el-button size="small" type="danger" @click="deleteDataSet(scope.row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 批量操作按钮 -->
        <div class="batch-actions" v-if="selectedDataSets.length > 0">
          <el-button type="danger" @click="batchDelete">
            批量删除 ({{ selectedDataSets.length }})
          </el-button>
        </div>
      </div>

      <!-- 数据样本查看对话框 -->
      <el-dialog
        title="数据样本"
        :visible.sync="sampleVisible"
        width="80%"
        @close="resetSampleData"
      >
        <div v-if="sampleData.length > 0">
          <p class="sample-info">文件: {{ currentDataSet?.name }} | 前{{ sampleData.length }}条记录</p>
          <el-table
            :data="sampleData"
            style="width: 100%"
            height="400px"
            border
          >
            <el-table-column
              v-for="(value, key) in sampleData[0]"
              :key="key"
              :prop="key"
              :label="key"
              width="120"
            >
              <template slot-scope="scope">
                {{ formatSampleValue(scope.row[key]) }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="no-data">
          <el-empty description="暂无数据样本"></el-empty>
        </div>
      </el-dialog>
      
      <!-- 文件信息 -->
      <div v-if="uploadedFileInfo" class="file-info">
        <el-alert
          :title="`已上传文件: ${uploadedFileInfo.filename}`"
          type="success"
          show-icon
        />
      </div>

      <!-- 数据预览表格 -->
      <div class="data-preview" v-if="dataPreview.length > 0">
        <h3>数据预览</h3>
        <el-table :data="paginatedData" stripe style="width: 100%">
          <el-table-column prop="年月" label="年月" width="120" />

      <!-- 文件信息 -->
      <div v-if="uploadedFileInfo" class="file-info">
        <el-alert
          :title="`已上传文件: ${uploadedFileInfo.filename}`"
          type="success"
          show-icon
        />
      </div>

      <!-- 数据预览表格 -->
      <div class="data-preview" v-if="dataPreview.length > 0">
        <h3>数据预览</h3>
        <el-table :data="paginatedData" stripe style="width: 100%">
          <el-table-column prop="年月" label="年月" width="120" />
          <el-table-column prop="小区ID" label="小区ID" width="180" />
          <el-table-column prop="y" label="y值" width="100" sortable />
          <el-table-column v-for="feature in displayFeatures" :key="feature" :prop="feature" :label="feature" width="100" />
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            :total="dataPreview.length"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </div>

      <!-- 数据概览 -->
      <div class="data-overview-section">
        <h3 class="section-title">数据概览</h3>
        <div class="overview-cards">
          <el-card class="overview-card" :body-style="{ padding: '20px' }">
            <div class="overview-item">
              <el-icon class="overview-icon"><Document /></el-icon>
              <div class="overview-info">
                <div class="overview-value">{{ dataStats?.totalRecords || 0 }}</div>
                <div class="overview-label">总记录数</div>
              </div>
            </div>
          </el-card>
          <el-card class="overview-card" :body-style="{ padding: '20px' }">
            <div class="overview-item">
              <el-icon class="overview-icon"><Collection /></el-icon>
              <div class="overview-info">
                <div class="overview-value">{{ dataStats?.communityCount || 0 }}</div>
                <div class="overview-label">小区数量</div>
              </div>
            </div>
          </el-card>
          <el-card class="overview-card" :body-style="{ padding: '20px' }">
            <div class="overview-item">
              <el-icon class="overview-icon"><Timer /></el-icon>
              <div class="overview-info">
                <div class="overview-value">{{ dataStats?.timeRange || '-' }}</div>
                <div class="overview-label">时间范围</div>
              </div>
            </div>
          </el-card>
          <el-card class="overview-card" :body-style="{ padding: '20px' }">
            <div class="overview-item">
              <el-icon class="overview-icon"><TrendCharts /></el-icon>
              <div class="overview-info">
                <div class="overview-value">{{ formatFloat(dataStats?.averageY || 0) }}</div>
                <div class="overview-label">平均y值</div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 特征选择 -->
      <div class="feature-selection" v-if="dataPreview.length > 0">
        <h3>特征选择</h3>
        <el-checkbox-group v-model="selectedFeatures">
          <el-row :gutter="10">
            <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="feature in availableFeatures" :key="feature">
              <el-checkbox :label="feature">{{ feature }}</el-checkbox>
            </el-col>
          </el-row>
        </el-checkbox-group>
        
        <div class="preprocess-actions">
          <el-button type="primary" @click="preprocessData" :disabled="selectedFeatures.length === 0">
            预处理数据
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted } from 'vue';
import { Upload, Document, Collection, Timer, TrendCharts } from '@element-plus/icons-vue';
import { ElButton, ElUpload, ElTable, ElTableColumn, ElPagination, ElAlert, ElRow, ElCol, ElCheckbox, ElCheckboxGroup, ElMessage, ElMessageBox, ElEmpty } from 'element-plus';
import { dataService } from '../services/data.service';

export default defineComponent({
  name: 'DataView',
  components: {
    ElButton,
    ElUpload,
    ElTable,
    ElTableColumn,
    ElPagination,
    ElAlert,
    ElRow,
    ElCol,
    ElCheckbox,
    ElCheckboxGroup,
    ElEmpty,
    Upload,
    Document,
    Collection,
    Timer,
    TrendCharts
  },
  setup() {
    // 上传相关状态
    const uploadVisible = ref(false);
    const uploadForm = ref({
      name: ''
    });
    const uploadFormRef = ref(null);
    const fileList = ref([]);
    const uploadLoading = ref(false);
    const uploadRules = ref({
      name: [
        { max: 50, message: '数据集名称长度不能超过50个字符', trigger: 'blur' }
      ]
    });
    
    // 数据集列表相关状态
    const dataSets = ref([]);
    const selectedDataSets = ref([]);
    const loading = ref(false);
    
    // 数据样本相关状态
    const sampleVisible = ref(false);
    const sampleData = ref([]);
    const currentDataSet = ref(null);
    
    // 原始数据管理状态
    const selectedFile = ref(null);
    const uploadedFileInfo = ref(null);
    const dataPreview = ref([]);
    const dataStats = ref(null);
    const currentPage = ref(1);
    const pageSize = ref(20);
    const selectedFeatures = ref(['小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', '区域特征4', '区域特征5', '区域特征6', '区域特征7', '区域特征8']);
    const availableFeatures = ref([
      '小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', 
      '区域特征4', '区域特征5', '区域特征6', '区域特征7', '区域特征8'
    ]);
    
    // 显示的特征（用于动态表格列）
    const displayFeatures = computed(() => {
      return selectedFeatures.value.slice(0, 8); // 限制显示的列数以避免表格过宽
    });

    // 分页数据
    const paginatedData = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return dataPreview.value.slice(start, end);
    });

    // 打开上传对话框
    const handleUploadClick = () => {
      uploadVisible.value = true;
    };
    
    // 重置上传表单
    const resetUploadForm = () => {
      fileList.value = [];
      uploadForm.value.name = '';
    };
    
    // 处理文件选择变化
    const handleFileChange = (file, fileList) => {
      selectedFile.value = file.raw;
      if (fileList) {
        fileList.value = fileList;
      }
      // 如果用户没有输入名称，使用文件名作为数据集名称
      if (!uploadForm.value.name && file.raw) {
        uploadForm.value.name = file.raw.name;
      }
    };
    
    // 处理文件超出限制
    const handleExceed = (files, fileList) => {
      ElMessage.warning(`当前限制上传1个文件，您选择了${files.length + fileList.length}个文件`);
    };
    
    // 上传前校验
    const beforeUpload = (file) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      if (!isCSV) {
        ElMessage.error('请上传CSV格式文件!');
        return false;
      }
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        ElMessage.error('上传文件大小不能超过 10MB!');
        return false;
      }
      return true;
    };
    
    // 提交上传
    const submitUpload = async () => {
      if (!selectedFile.value) {
        ElMessage.error('请选择要上传的文件');
        return;
      }
      
      const formData = new FormData();
      formData.append('file', selectedFile.value);
      if (uploadForm.value.name) {
        formData.append('name', uploadForm.value.name);
      }
      
      uploadLoading.value = true;
      try {
        const response = await dataService.uploadData(formData);
        
        if (response.data.success) {
          ElMessage.success(response.data.message || '文件上传成功');
          uploadVisible.value = false;
          resetUploadForm();
          // 重新获取数据集列表
          fetchDataSets();
          // 获取上传后的数据预览
          await fetchDataPreview();
        } else {
          ElMessage.error(response.data.message || '文件上传失败');
        }
      } catch (error) {
        console.error('文件上传错误:', error);
        ElMessage.error('文件上传失败，请重试');
      } finally {
        uploadLoading.value = false;
      }
    };
    
    // 旧的上传文件方法，保持向后兼容
    const uploadFile = async () => {
      if (!selectedFile.value) return;

      try {
        const formData = new FormData();
        formData.append('file', selectedFile.value);
        
        const response = await dataService.uploadFile(formData);
        uploadedFileInfo.value = response.data;
        
        // 获取上传后的数据预览
        await fetchDataPreview();
        
        ElMessage.success('文件上传成功！');
      } catch (error) {
        ElMessage.error('文件上传失败：' + error.message);
      }
    };

    // 获取示例数据
    const getSampleData = async () => {
      try {
        const response = await dataService.getSampleData();
        dataPreview.value = response.data;
        calculateStats(dataPreview.value);
        ElMessage.success('成功加载示例数据！');
      } catch (error) {
        ElMessage.error('加载示例数据失败：' + error.message);
      }
    };

    // 获取数据集列表
    const fetchDataSets = async () => {
      loading.value = true;
      try {
        const response = await dataService.getDataSets();
        dataSets.value = response.data || [];
      } catch (error) {
        console.error('获取数据集列表错误:', error);
        ElMessage.error('获取数据集列表失败，请重试');
      } finally {
        loading.value = false;
      }
    };
    
    // 获取数据预览
    const fetchDataPreview = async () => {
      try {
        const response = await dataService.getSampleData();
        dataPreview.value = response.data;
        calculateStats(dataPreview.value);
      } catch (error) {
        console.error('获取数据预览失败:', error);
        ElMessage.error('获取数据预览失败：' + error.message);
      }
    };
    
    // 查看数据样本
    const viewDataSample = async (dataSet) => {
      currentDataSet.value = dataSet;
      sampleData.value = [];
      sampleVisible.value = true;
      
      try {
        const response = await dataService.getDataSample(dataSet.id, 20);
        sampleData.value = response.data;
      } catch (error) {
        console.error('获取数据样本错误:', error);
        ElMessage.error('获取数据样本失败，请重试');
      }
    };
    
    // 删除数据集
    const deleteDataSet = async (dataSetId) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除这个数据集吗？此操作不可撤销。',
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        const response = await dataService.deleteDataset(dataSetId);
        
        if (response.data.success) {
          ElMessage.success(response.data.message || '数据集删除成功');
          fetchDataSets();
        } else {
          ElMessage.error(response.data.message || '数据集删除失败');
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除数据集错误:', error);
          ElMessage.error('数据集删除失败，请重试');
        }
      }
    };
    
    // 批量删除数据集
    const batchDelete = async () => {
      try {
        await ElMessageBox.confirm(
          `确定要删除选中的${selectedDataSets.value.length}个数据集吗？此操作不可撤销。`,
          '批量删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        const ids = selectedDataSets.value.map(item => item.id);
        let successCount = 0;
        
        // 依次删除每个数据集
        for (const id of ids) {
          try {
            const response = await dataService.deleteDataset(id);
            if (response.data.success) {
              successCount++;
            }
          } catch (err) {
            console.error(`删除数据集 ${id} 错误:`, err);
          }
        }
        
        ElMessage.success(`成功删除${successCount}个数据集`);
        selectedDataSets.value = [];
        fetchDataSets();
      } catch (error) {
        if (error !== 'cancel') {
          console.error('批量删除数据集错误:', error);
          ElMessage.error('批量删除失败，请重试');
        }
      }
    };
    
    // 重置样本数据
    const resetSampleData = () => {
      sampleData.value = [];
      currentDataSet.value = null;
    };
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedDataSets.value = selection;
    };
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // 格式化样本值
    const formatSampleValue = (value) => {
      if (value === null || value === undefined) return '-';
      
      // 如果是数字类型且小数位数较多，则格式化显示
      if (typeof value === 'number' && !Number.isInteger(value)) {
        return value.toFixed(4);
      }
      
      return value.toString();
    };
    
    // 格式化浮点数显示
    const formatFloat = (value) => {
      return typeof value === 'number' ? value.toFixed(4) : '0.0000';
    };

    // 计算数据统计
    const calculateStats = (data) => {
      if (!data || data.length === 0) return;

      const communityIds = new Set(data.map(item => item['小区ID']));
      const timestamps = data.map(item => item['年月']);
      const yValues = data.map(item => item['y']).filter(val => !isNaN(val));
      
      dataStats.value = {
        totalRecords: data.length,
        communityCount: communityIds.size,
        timeRange: timestamps.length > 0 ? `${Math.min(...timestamps)} 至 ${Math.max(...timestamps)}` : '-',
        averageY: yValues.length > 0 ? yValues.reduce((sum, val) => sum + val, 0) / yValues.length : 0
      };
    };

    // 分页处理
    const handleSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1;
    };

    const handleCurrentChange = (current) => {
      currentPage.value = current;
    };

    // 预处理数据
    const preprocessData = async () => {
      try {
        const response = await dataService.preprocessData({
          inputFeatures: selectedFeatures.value,
          targetFeature: 'y'
        });
        ElMessage.success('数据预处理完成！');
        // 可以保存预处理结果信息
      } catch (error) {
        ElMessage.error('数据预处理失败：' + error.message);
      }
    };

    // 组件挂载时尝试获取数据
    onMounted(() => {
      fetchDataPreview();
    });

    return {
      // 上传相关
      uploadVisible,
      uploadForm,
      uploadFormRef,
      fileList,
      uploadLoading,
      uploadRules,
      handleUploadClick,
      resetUploadForm,
      handleFileChange,
      handleExceed,
      submitUpload,
      
      // 数据集管理
      dataSets,
      selectedDataSets,
      loading,
      sampleVisible,
      sampleData,
      currentDataSet,
      viewDataSample,
      deleteDataSet,
      batchDelete,
      resetSampleData,
      handleSelectionChange,
      formatDate,
      formatSampleValue,
      formatFloat,
      
      // 数据预览和统计
      selectedFile,
      uploadedFileInfo,
      dataPreview,
      dataStats,
      currentPage,
      pageSize,
      paginatedData,
      selectedFeatures,
      availableFeatures,
      displayFeatures,
      beforeUpload,
      uploadFile,
      getSampleData,
      handleSizeChange,
      handleCurrentChange,
      preprocessData
    };
  },
  mounted() {
    // 组件挂载时获取数据集列表和数据预览
    this.fetchDataSets();
  }
});
</script>

<style scoped>
.data-view-container {
    padding: 20px;
  }

  .data-view-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
  }

  .section-title {
    margin-top: 20px;
    margin-bottom: 15px;
    font-size: 18px;
    font-weight: bold;
    color: #303133;
  }

  .upload-section {
    display: flex;
    gap: 16px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .file-info {
    margin-bottom: 24px;
  }

  .data-preview {
    margin-bottom: 32px;
  }

  .data-preview h3,
  .feature-selection h3 {
    margin-bottom: 16px;
    color: #333;
    font-size: 16px;
    font-weight: 600;
  }

  .pagination-container {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .batch-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;
  }

  .sample-info {
    margin-bottom: 10px;
    font-size: 14px;
    color: #606266;
  }

  .no-data {
    padding: 40px 0;
  }

  .overview-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-top: 20px;
    margin-bottom: 32px;
  }

  .overview-card {
    transition: all 0.3s ease;
  }

  .overview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .overview-item {
    display: flex;
    align-items: center;
  }

  .overview-icon {
    font-size: 28px;
    margin-right: 16px;
    color: #409EFF;
  }

  .overview-info {
    flex: 1;
  }

  .overview-value {
    font-size: 24px;
    font-weight: bold;
    color: #303133;
  }

  .overview-label {
    font-size: 14px;
    color: #606266;
    margin-top: 4px;
  }

  .feature-selection {
    margin-top: 32px;
  }

  .preprocess-actions {
    margin-top: 20px;
    text-align: center;
  }

  @media (max-width: 768px) {
    .upload-section {
      flex-direction: column;
    }
    
    .overview-cards {
      grid-template-columns: 1fr;
    }
  }
</style>