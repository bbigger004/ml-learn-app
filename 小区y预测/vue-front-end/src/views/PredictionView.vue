<template>
  <div class="prediction-view-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预测结果</span>
        </div>
      </template>

      <!-- 预测设置表单 -->
      <div class="prediction-settings">
        <h3>预测设置</h3>
        <el-form :model="predictionForm" :rules="predictionRules" ref="predictionFormRef" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择模型" prop="modelId">
                <el-select v-model="predictionForm.modelId" placeholder="请选择一个训练好的模型">
                  <el-option v-for="model in modelList" :key="model.id" :label="model.name" :value="model.id" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="预测月份" prop="months">
                <el-input-number v-model="predictionForm.months" :min="1" :max="12" :step="1" />
                <div class="form-tip">预测未来n个月的数据</div>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="预测选项">
            <el-checkbox v-model="predictionForm.calculateConfidence">计算置信区间</el-checkbox>
          </el-form-item>
          
          <el-form-item>
            <div class="form-actions">
              <el-button type="primary" @click="startPrediction" :loading="isPredicting">
                <el-icon v-if="!isPredicting"><TrendCharts /></el-icon>
                <el-icon v-else><Loading /></el-icon>
                {{ isPredicting ? '预测中...' : '开始预测' }}
              </el-button>
              <el-button type="success" @click="compareModels" :disabled="isPredicting || modelList.length < 2">
                模型对比
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 预测结果 -->
      <div v-if="predictionResult" class="prediction-results">
        <h3>预测结果展示</h3>
        <div class="results-tabs">
          <el-tabs v-model="activeTab" type="border-card">
            <el-tab-pane label="预测趋势图" name="trend">
              <div ref="trendChartRef" style="width: 100%; height: 400px;"></div>
            </el-tab-pane>
            <el-tab-pane label="预测表格" name="table">
              <el-table :data="predictionDataTable" stripe style="width: 100%">
                <el-table-column prop="date" label="预测日期" width="120" />
                <el-table-column prop="predicted" label="预测值" width="150" :formatter="formatValue" />
                <el-table-column prop="lowerBound" label="置信下限" width="150" v-if="predictionForm.calculateConfidence" :formatter="formatValue" />
                <el-table-column prop="upperBound" label="置信上限" width="150" v-if="predictionForm.calculateConfidence" :formatter="formatValue" />
                <el-table-column label="操作" width="100" fixed="right">
                  <template #default="scope">
                    <el-button type="primary" size="small" @click="exportData">
                      导出
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="统计信息" name="stats">
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-label">平均预测值</div>
                  <div class="stat-value">{{ calculateAverage().toFixed(4) }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">最大预测值</div>
                  <div class="stat-value">{{ calculateMax().toFixed(4) }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">最小预测值</div>
                  <div class="stat-value">{{ calculateMin().toFixed(4) }}</div>
                </div>
                <div class="stat-card">
                  <div class="stat-label">中位数</div>
                  <div class="stat-value">{{ calculateMedian().toFixed(4) }}</div>
                </div>
              </div>
              <div class="prediction-summary">
                <h4>预测总结</h4>
                <p>基于模型{{ selectedModel?.name }}的预测结果显示，未来{{ predictionForm.months }}个月的y值呈现{{ getTrend() }}趋势。</p>
                <p v-if="getTrend() === '上升'">预计最大值将达到{{ calculateMax().toFixed(4) }}，发生在{{ getMaxDate() }}。</p>
                <p v-else-if="getTrend() === '下降'">预计最小值将达到{{ calculateMin().toFixed(4) }}，发生在{{ getMinDate() }}。</p>
                <p>整体波动幅度为{{ calculateRange().toFixed(4) }}，平均预测值为{{ calculateAverage().toFixed(4) }}。</p>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 模型对比对话框 -->
      <el-dialog v-model="showCompareDialog" title="模型对比" width="80%">
        <div class="compare-settings">
          <el-form :model="compareForm" :rules="compareRules" ref="compareFormRef" label-width="120px">
            <el-form-item label="选择模型" prop="modelIds">
              <el-checkbox-group v-model="compareForm.modelIds">
                <el-row :gutter="10">
                  <el-col :xs="24" :sm="12" :md="8" v-for="model in modelList" :key="model.id">
                    <el-checkbox :label="model.id">{{ model.name }}</el-checkbox>
                  </el-col>
                </el-row>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="预测月份" prop="months">
              <el-input-number v-model="compareForm.months" :min="1" :max="12" :step="1" />
            </el-form-item>
          </el-form>
        </div>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="showCompareDialog = false">取消</el-button>
            <el-button type="primary" @click="startCompare" :loading="isComparing">开始对比</el-button>
          </span>
        </template>
        
        <!-- 模型对比结果 -->
        <div v-if="comparisonResult" class="comparison-results">
          <h4>对比结果</h4>
          <div ref="compareChartRef" style="width: 100%; height: 400px;"></div>
          
          <el-table :data="comparisonMetrics" stripe style="width: 100%; margin-top: 20px;">
            <el-table-column prop="modelName" label="模型名称" width="180" />
            <el-table-column prop="avgPrediction" label="平均预测值" width="120" :formatter="formatValue" />
            <el-table-column prop="maxPrediction" label="最大预测值" width="120" :formatter="formatValue" />
            <el-table-column prop="minPrediction" label="最小预测值" width="120" :formatter="formatValue" />
            <el-table-column prop="stdDev" label="标准差" width="100" :formatter="formatValue" />
          </el-table>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, computed, onMounted, nextTick } from 'vue';
import { TrendCharts, Loading } from '@element-plus/icons-vue';
import { ElButton, ElForm, ElFormItem, ElInputNumber, ElSelect, ElOption, ElCheckbox, ElCheckboxGroup, ElRow, ElCol, ElTable, ElTableColumn, ElTabs, ElTabPane, ElDialog, ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { modelService } from '../services/model.service';
import { predictionService } from '../services/prediction.service';

export default defineComponent({
  name: 'PredictionView',
  components: {
    ElButton,
    ElForm,
    ElFormItem,
    ElInputNumber,
    ElSelect,
    ElOption,
    ElCheckbox,
    ElCheckboxGroup,
    ElRow,
    ElCol,
    ElTable,
    ElTableColumn,
    ElTabs,
    ElTabPane,
    ElDialog,
    TrendCharts,
    Loading
  },
  setup() {
    const predictionFormRef = ref(null);
    const compareFormRef = ref(null);
    const trendChartRef = ref(null);
    const compareChartRef = ref(null);
    const trendChart = ref(null);
    const compareChart = ref(null);
    const isPredicting = ref(false);
    const isComparing = ref(false);
    const activeTab = ref('trend');
    const showCompareDialog = ref(false);
    const predictionResult = ref(null);
    const comparisonResult = ref(null);
    const modelList = ref([]);

    // 预测表单
    const predictionForm = reactive({
      modelId: '',
      months: 6,
      calculateConfidence: true
    });

    const predictionRules = {
      modelId: [
        { required: true, message: '请选择一个模型', trigger: 'change' }
      ],
      months: [
        { required: true, message: '请设置预测月份数', trigger: 'change' }
      ]
    };

    // 模型对比表单
    const compareForm = reactive({
      modelIds: [],
      months: 6
    });

    const compareRules = {
      modelIds: [
        { required: true, message: '请至少选择两个模型', trigger: 'change', validator: (rule, value) => value.length >= 2 }
      ],
      months: [
        { required: true, message: '请设置预测月份数', trigger: 'change' }
      ]
    };

    // 计算属性：选中的模型
    const selectedModel = computed(() => {
      return modelList.value.find(model => model.id === predictionForm.modelId);
    });

    // 计算属性：预测数据表格
    const predictionDataTable = computed(() => {
      if (!predictionResult.value || !predictionResult.value.predictions) return [];
      
      return predictionResult.value.predictions.map(point => {
        return {
          date: point.date,
          predicted: point.value,
          lowerBound: point.confidence?.lower,
          upperBound: point.confidence?.upper
        };
      });
    });

    // 计算属性：对比指标数据
    const comparisonMetrics = computed(() => {
      if (!comparisonResult.value || !comparisonResult.value.comparisons) return [];
      
      return comparisonResult.value.comparisons.map(comp => {
        const values = comp.predictions.map(p => p.value);
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / values.length;
        
        return {
          modelName: comp.modelName,
          avgPrediction: avg,
          maxPrediction: Math.max(...values),
          minPrediction: Math.min(...values),
          stdDev: Math.sqrt(variance)
        };
      });
    });

    // 开始预测
    const startPrediction = async () => {
      if (!predictionFormRef.value.validate()) return;

      isPredicting.value = true;

      try {
        const response = await predictionService.predict({
          modelId: predictionForm.modelId,
          months: predictionForm.months,
          calculateConfidence: predictionForm.calculateConfidence
        });
        
        predictionResult.value = response.data;
        await nextTick();
        renderTrendChart();
        ElMessage.success('预测完成！');
      } catch (error) {
        ElMessage.error('预测失败：' + error.message);
      } finally {
        isPredicting.value = false;
      }
    };

    // 渲染趋势图
    const renderTrendChart = () => {
      if (!trendChartRef.value || !predictionResult.value) return;
      
      if (trendChart.value) {
        trendChart.value.dispose();
      }
      
      trendChart.value = echarts.init(trendChartRef.value);
      
      const predictions = predictionResult.value.predictions;
      const dates = predictions.map(p => p.date);
      const values = predictions.map(p => p.value);
      
      const option = {
        title: {
          text: `${selectedModel.value?.name || '模型'} 预测结果`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['预测值'],
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
          data: dates
        },
        yAxis: {
          type: 'value',
          name: 'y值'
        },
        series: [
          {
            name: '预测值',
            type: 'line',
            data: values,
            smooth: true,
            lineStyle: {
              color: '#409EFF'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: 'rgba(64, 158, 255, 0.3)'
                },
                {
                  offset: 1,
                  color: 'rgba(64, 158, 255, 0.1)'
                }
              ])
            },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            },
            markLine: {
              data: [
                { type: 'average', name: '平均值' }
              ]
            }
          }
        ]
      };
      
      // 如果有置信区间，添加到图表
      if (predictionForm.calculateConfidence && predictions[0].confidence) {
        const lowerBounds = predictions.map(p => p.confidence.lower);
        const upperBounds = predictions.map(p => p.confidence.upper);
        
        option.legend.data.push('置信区间');
        option.series.push({
          name: '置信上限',
          type: 'line',
          data: upperBounds,
          smooth: true,
          lineStyle: {
            opacity: 0
          },
          stack: 'confidence',
          symbol: 'none',
          emphasis: {
            focus: 'series'
          }
        });
        option.series.push({
          name: '置信下限',
          type: 'line',
          data: lowerBounds,
          smooth: true,
          lineStyle: {
            opacity: 0
          },
          stack: 'confidence',
          symbol: 'none',
          areaStyle: {
            color: 'rgba(64, 158, 255, 0.2)'
          },
          emphasis: {
            focus: 'series'
          }
        });
      }
      
      trendChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (trendChart.value) {
          trendChart.value.resize();
        }
      });
    };

    // 模型对比
    const compareModels = () => {
      showCompareDialog.value = true;
      compareForm.modelIds = [];
      compareForm.months = predictionForm.months;
    };

    // 开始对比
    const startCompare = async () => {
      if (!compareFormRef.value.validate()) return;

      isComparing.value = true;

      try {
        const response = await predictionService.compareModels({
          modelIds: compareForm.modelIds,
          months: compareForm.months
        });
        
        comparisonResult.value = response.data;
        await nextTick();
        renderCompareChart();
        ElMessage.success('模型对比完成！');
      } catch (error) {
        ElMessage.error('模型对比失败：' + error.message);
      } finally {
        isComparing.value = false;
      }
    };

    // 渲染对比图表
    const renderCompareChart = () => {
      if (!compareChartRef.value || !comparisonResult.value) return;
      
      if (compareChart.value) {
        compareChart.value.dispose();
      }
      
      compareChart.value = echarts.init(compareChartRef.value);
      
      const dates = comparisonResult.value.comparisons[0]?.predictions.map(p => p.date) || [];
      const series = comparisonResult.value.comparisons.map((comp, index) => {
        const colors = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399'];
        const color = colors[index % colors.length];
        
        return {
          name: comp.modelName,
          type: 'line',
          data: comp.predictions.map(p => p.value),
          smooth: true,
          lineStyle: {
            color: color
          },
          emphasis: {
            focus: 'series'
          }
        };
      });
      
      const option = {
        title: {
          text: '模型预测对比',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: comparisonResult.value.comparisons.map(c => c.modelName),
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
          data: dates
        },
        yAxis: {
          type: 'value',
          name: 'y值'
        },
        series: series
      };
      
      compareChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (compareChart.value) {
          compareChart.value.resize();
        }
      });
    };

    // 导出数据
    const exportData = () => {
      if (!predictionResult.value) return;
      
      // 构建CSV内容
      let csvContent = '日期,预测值';
      if (predictionForm.calculateConfidence) {
        csvContent += ',置信下限,置信上限';
      }
      csvContent += '\n';
      
      predictionResult.value.predictions.forEach(point => {
        csvContent += `${point.date},${point.value}`;
        if (predictionForm.calculateConfidence && point.confidence) {
          csvContent += `,${point.confidence.lower},${point.confidence.upper}`;
        }
        csvContent += '\n';
      });
      
      // 创建下载链接
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedModel.value?.name || 'prediction'}_${new Date().toISOString().slice(0, 10)}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      ElMessage.success('数据导出成功！');
    };

    // 辅助计算函数
    const calculateAverage = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return 0;
      const values = predictionResult.value.predictions.map(p => p.value);
      return values.reduce((a, b) => a + b, 0) / values.length;
    };

    const calculateMax = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return 0;
      const values = predictionResult.value.predictions.map(p => p.value);
      return Math.max(...values);
    };

    const calculateMin = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return 0;
      const values = predictionResult.value.predictions.map(p => p.value);
      return Math.min(...values);
    };

    const calculateMedian = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return 0;
      const values = predictionResult.value.predictions.map(p => p.value).sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      return values.length % 2 !== 0 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
    };

    const calculateRange = () => {
      return calculateMax() - calculateMin();
    };

    const getTrend = () => {
      if (!predictionResult.value || !predictionResult.value.predictions || predictionResult.value.predictions.length < 2) return '稳定';
      
      const firstValue = predictionResult.value.predictions[0].value;
      const lastValue = predictionResult.value.predictions[predictionResult.value.predictions.length - 1].value;
      const changePercentage = ((lastValue - firstValue) / firstValue) * 100;
      
      if (changePercentage > 5) return '上升';
      if (changePercentage < -5) return '下降';
      return '稳定';
    };

    const getMaxDate = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return '';
      let maxValue = -Infinity;
      let maxDate = '';
      
      predictionResult.value.predictions.forEach(p => {
        if (p.value > maxValue) {
          maxValue = p.value;
          maxDate = p.date;
        }
      });
      
      return maxDate;
    };

    const getMinDate = () => {
      if (!predictionResult.value || !predictionResult.value.predictions) return '';
      let minValue = Infinity;
      let minDate = '';
      
      predictionResult.value.predictions.forEach(p => {
        if (p.value < minValue) {
          minValue = p.value;
          minDate = p.date;
        }
      });
      
      return minDate;
    };

    const formatValue = (row, column, value) => {
      if (value === null || value === undefined) return '-';
      return Number(value).toFixed(4);
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

    // 组件挂载时加载模型列表
    onMounted(() => {
      loadModelList();
    });

    return {
      predictionFormRef,
      compareFormRef,
      trendChartRef,
      compareChartRef,
      isPredicting,
      isComparing,
      activeTab,
      showCompareDialog,
      predictionResult,
      comparisonResult,
      modelList,
      predictionForm,
      predictionRules,
      compareForm,
      compareRules,
      selectedModel,
      predictionDataTable,
      comparisonMetrics,
      startPrediction,
      compareModels,
      startCompare,
      exportData,
      calculateAverage,
      calculateMax,
      calculateMin,
      calculateMedian,
      calculateRange,
      getTrend,
      getMaxDate,
      getMinDate,
      formatValue
    };
  }
});
</script>

<style scoped>
.prediction-view-container {
  padding: 20px;
}

.prediction-settings h3,
.prediction-results h3,
.comparison-results h4 {
  margin-bottom: 20px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
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

.results-tabs {
  margin-top: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.stat-value {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.prediction-summary {
  background: #f0f9ff;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  padding: 20px;
  margin-top: 20px;
}

.prediction-summary h4 {
  color: #1976d2;
  margin-bottom: 15px;
  font-size: 16px;
}

.prediction-summary p {
  color: #666;
  margin-bottom: 10px;
  line-height: 1.6;
}

.compare-settings {
  margin-bottom: 20px;
}

.dialog-footer {
  text-align: center;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>