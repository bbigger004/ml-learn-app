<template>
  <div class="model-view-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模型管理</span>
        </div>
      </template>

      <!-- 模型训练表单 -->
      <div class="train-section">
        <h3>模型训练</h3>
        <el-form :model="trainForm" :rules="trainRules" ref="trainFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="模型名称" prop="modelName">
                <el-input v-model="trainForm.modelName" placeholder="请输入模型名称" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="训练轮数" prop="epochs">
                <el-input-number v-model="trainForm.epochs" :min="1" :max="1000" :step="10" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学习率" prop="learningRate">
                <el-input-number v-model="trainForm.learningRate" :min="0.0001" :max="1" :step="0.0001" :precision="4" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="批次大小" prop="batchSize">
                <el-input-number v-model="trainForm.batchSize" :min="1" :max="100" :step="1" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="回溯窗口" prop="lookBack">
                <el-input-number v-model="trainForm.lookBack" :min="1" :max="100" :step="1" />
                <div class="form-tip">使用过去n个月的数据预测未来</div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="验证集比例" prop="validationSplit">
                <el-input-number v-model="trainForm.validationSplit" :min="0" :max="1" :step="0.1" :precision="1" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="目标特征">
            <el-select v-model="trainForm.targetFeature" placeholder="选择目标特征">
              <el-option label="y值" value="y" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="输入特征">
            <el-checkbox-group v-model="trainForm.inputFeatures">
              <el-row :gutter="10">
                <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="feature in availableFeatures" :key="feature">
                  <el-checkbox :label="feature">{{ feature }}</el-checkbox>
                </el-col>
              </el-row>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" @click="startTraining" :loading="isTraining">
                <el-icon v-if="!isTraining"><Cpu /></el-icon>
                <el-icon v-else><Loading /></el-icon>
                {{ isTraining ? '训练中...' : '开始训练' }}
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 训练进度 -->
      <div v-if="isTraining" class="training-progress">
        <el-progress :percentage="trainingProgress" :status="trainingStatus" />
        <div class="training-info">
          <p>当前轮次: {{ currentEpoch }}/{{ trainForm.epochs }}</p>
          <p>损失值: {{ currentLoss.toFixed(6) }}</p>
          <p v-if="currentValLoss">验证损失: {{ currentValLoss.toFixed(6) }}</p>
        </div>
      </div>

      <!-- 模型列表 -->
      <div class="model-list-section">
        <h3>已训练模型</h3>
        <el-table :data="modelList" stripe style="width: 100%">
          <el-table-column prop="name" label="模型名称" width="200" />
          <el-table-column prop="id" label="模型ID" width="250" />
          <el-table-column prop="type" label="模型类型" width="100" />
          <el-table-column prop="created_at" label="创建时间" width="180" :formatter="formatDate" />
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button type="primary" size="small" @click="evaluateModel(scope.row.id)">
                评估
              </el-button>
              <el-button type="danger" size="small" @click="deleteModel(scope.row.id)" :confirm-message="'确定要删除该模型吗？'">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 模型评估结果 -->
      <div v-if="evaluationResult" class="evaluation-section">
        <h3>模型评估结果</h3>
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="metric-card">
              <div class="metric-label">均方误差 (MSE)</div>
              <div class="metric-value">{{ evaluationResult.mse.toFixed(6) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-card">
              <div class="metric-label">均方根误差 (RMSE)</div>
              <div class="metric-value">{{ evaluationResult.rmse.toFixed(6) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-card">
              <div class="metric-label">平均绝对误差 (MAE)</div>
              <div class="metric-value">{{ evaluationResult.mae.toFixed(6) }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="metric-card">
              <div class="metric-label">决定系数 (R²)</div>
              <div class="metric-value">{{ evaluationResult.r2.toFixed(6) }}</div>
            </div>
          </el-col>
        </el-row>

        <!-- 训练历史图表 -->
        <div v-if="trainingHistory" class="history-chart">
          <h4>训练历史</h4>
          <div ref="historyChartRef" style="width: 100%; height: 400px;"></div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, nextTick } from 'vue';
import { Cpu, Loading } from '@element-plus/icons-vue';
import { ElButton, ElForm, ElFormItem, ElInput, ElInputNumber, ElSelect, ElOption, ElCheckbox, ElCheckboxGroup, ElRow, ElCol, ElTable, ElTableColumn, ElProgress, ElMessage, ElMessageBox } from 'element-plus';
import * as echarts from 'echarts';
import { modelService } from '../services/model.service';

export default defineComponent({
  name: 'ModelView',
  components: {
    ElButton,
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElSelect,
    ElOption,
    ElCheckbox,
    ElCheckboxGroup,
    ElRow,
    ElCol,
    ElTable,
    ElTableColumn,
    ElProgress,
    Cpu,
    Loading
  },
  setup() {
    const trainFormRef = ref(null);
    const historyChartRef = ref(null);
    const historyChart = ref(null);
    const isTraining = ref(false);
    const trainingProgress = ref(0);
    const trainingStatus = ref('');
    const currentEpoch = ref(0);
    const currentLoss = ref(0);
    const currentValLoss = ref(0);
    const modelList = ref([]);
    const evaluationResult = ref(null);
    const trainingHistory = ref(null);

    // 训练表单
    const trainForm = reactive({
      modelName: '',
      epochs: 100,
      learningRate: 0.001,
      batchSize: 32,
      lookBack: 12,
      validationSplit: 0.2,
      inputFeatures: ['小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', '区域特征4', '区域特征5', '区域特征6', '区域特征7', '区域特征8'],
      targetFeature: 'y'
    });

    const trainRules = {
      modelName: [
        { required: true, message: '请输入模型名称', trigger: 'blur' }
      ],
      epochs: [
        { required: true, message: '请设置训练轮数', trigger: 'change' }
      ],
      inputFeatures: [
        { required: true, message: '请至少选择一个输入特征', trigger: 'change' }
      ]
    };

    const availableFeatures = [
      '小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', 
      '区域特征4', '区域特征5', '区域特征6', '区域特征7', '区域特征8'
    ];

    // 开始训练
    const startTraining = async () => {
      if (!trainFormRef.value.validate()) return;

      isTraining.value = true;
      trainingProgress.value = 0;
      currentEpoch.value = 0;
      currentLoss.value = 0;
      currentValLoss.value = 0;
      trainingStatus.value = 'primary';

      try {
        const response = await modelService.trainModel(trainForm);
        
        // 模拟训练进度
        const trainInterval = setInterval(() => {
          currentEpoch.value++;
          trainingProgress.value = Math.min(100, (currentEpoch.value / trainForm.epochs) * 100);
          
          // 模拟损失值递减
          currentLoss.value = 0.5 * Math.exp(-currentEpoch.value / 20);
          currentValLoss.value = 0.6 * Math.exp(-currentEpoch.value / 18);
          
          if (currentEpoch.value >= trainForm.epochs) {
            clearInterval(trainInterval);
            trainingStatus.value = 'success';
            isTraining.value = false;
            ElMessage.success('模型训练完成！');
            loadModelList();
          }
        }, 200);
        
        // 保存训练历史
        trainingHistory.value = response.data.history;
        await nextTick();
        renderHistoryChart();
        
      } catch (error) {
        isTraining.value = false;
        trainingStatus.value = 'exception';
        ElMessage.error('模型训练失败：' + error.message);
      }
    };

    // 重置表单
    const resetForm = () => {
      if (trainFormRef.value) {
        trainFormRef.value.resetFields();
      }
    };

    // 加载模型列表
    const loadModelList = async () => {
      try {
        const response = await modelService.getModelList();
        modelList.value = response.data;
      } catch (error) {
        ElMessage.error('加载模型列表失败：' + error.message);
      }
    };

    // 评估模型
    const evaluateModel = async (modelId) => {
      try {
        const response = await modelService.evaluateModel(modelId);
        evaluationResult.value = response.data;
        
        // 如果有训练历史，渲染图表
        if (evaluationResult.value.history) {
          trainingHistory.value = evaluationResult.value.history;
          await nextTick();
          renderHistoryChart();
        }
        
        ElMessage.success('模型评估完成！');
      } catch (error) {
        ElMessage.error('模型评估失败：' + error.message);
      }
    };

    // 删除模型
    const deleteModel = async (modelId) => {
      try {
        await ElMessageBox.confirm(
          '确定要删除该模型吗？此操作不可撤销。',
          '删除确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        await modelService.deleteModel(modelId);
        modelList.value = modelList.value.filter(model => model.id !== modelId);
        
        // 如果当前评估的是被删除的模型，清空评估结果
        if (evaluationResult.value && evaluationResult.value.modelId === modelId) {
          evaluationResult.value = null;
          trainingHistory.value = null;
        }
        
        ElMessage.success('模型删除成功！');
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('模型删除失败：' + error.message);
        }
      }
    };

    // 渲染训练历史图表
    const renderHistoryChart = () => {
      if (!historyChartRef.value || !trainingHistory.value) return;
      
      if (historyChart.value) {
        historyChart.value.dispose();
      }
      
      historyChart.value = echarts.init(historyChartRef.value);
      
      const option = {
        title: {
          text: '训练过程损失值变化',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['训练损失', '验证损失'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: Array.from({ length: trainingHistory.value.loss.length }, (_, i) => i + 1),
          name: 'Epoch'
        },
        yAxis: {
          type: 'log',
          name: '损失值'
        },
        series: [
          {
            name: '训练损失',
            type: 'line',
            data: trainingHistory.value.loss,
            smooth: true,
            lineStyle: {
              color: '#67C23A'
            }
          },
          {
            name: '验证损失',
            type: 'line',
            data: trainingHistory.value.val_loss,
            smooth: true,
            lineStyle: {
              color: '#F56C6C'
            }
          }
        ]
      };
      
      historyChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (historyChart.value) {
          historyChart.value.resize();
        }
      });
    };

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    // 组件挂载时加载模型列表
    onMounted(() => {
      loadModelList();
    });

    return {
      trainFormRef,
      historyChartRef,
      isTraining,
      trainingProgress,
      trainingStatus,
      currentEpoch,
      currentLoss,
      currentValLoss,
      modelList,
      evaluationResult,
      trainingHistory,
      trainForm,
      trainRules,
      availableFeatures,
      startTraining,
      resetForm,
      evaluateModel,
      deleteModel,
      formatDate
    };
  }
});
</script>

<style scoped>
.model-view-container {
  padding: 20px;
}

.train-section h3,
.model-list-section h3,
.evaluation-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.training-progress {
  margin: 20px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.training-info {
  margin-top: 16px;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.training-info p {
  margin: 0;
  color: #666;
}

.form-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 20px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.metric-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s ease;
  margin-bottom: 20px;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.metric-value {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.history-chart {
  margin-top: 32px;
}

.history-chart h4 {
  margin-bottom: 16px;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 768px) {
  .training-info {
    flex-direction: column;
    gap: 8px;
  }
}
</style>