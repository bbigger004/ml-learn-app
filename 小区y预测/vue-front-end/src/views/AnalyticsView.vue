<template>
  <div class="analytics-view-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>数据分析</span>
        </div>
      </template>

      <!-- 数据概览 -->
      <div class="overview-section">
        <h3>数据概览</h3>
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="6" v-for="metric in dataMetrics" :key="metric.label">
            <div class="metric-card">
              <div class="metric-icon" :style="{ backgroundColor: metric.color + '20' }">
                <el-icon :style="{ color: metric.color }"><component :is="metric.icon" /></el-icon>
              </div>
              <div class="metric-content">
                <div class="metric-label">{{ metric.label }}</div>
                <div class="metric-value">{{ metric.value }}</div>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 分析选项卡 -->
      <div class="analysis-tabs">
        <el-tabs v-model="activeTab" type="border-card">
          <el-tab-pane label="数据分布" name="distribution">
            <div class="tab-content">
              <div class="chart-controls">
                <el-select v-model="selectedFeature" placeholder="选择特征" @change="renderDistributionChart">
                  <el-option v-for="feature in numericFeatures" :key="feature" :label="feature" :value="feature" />
                </el-select>
                <el-radio-group v-model="chartType" @change="renderDistributionChart">
                  <el-radio-button label="histogram">直方图</el-radio-button>
                  <el-radio-button label="boxplot">箱线图</el-radio-button>
                </el-radio-group>
              </div>
              <div ref="distributionChartRef" style="width: 100%; height: 400px;"></div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="相关性分析" name="correlation">
            <div class="tab-content">
              <div ref="correlationChartRef" style="width: 100%; height: 500px;"></div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="时间趋势" name="trend">
            <div class="tab-content">
              <div class="chart-controls">
                <el-select v-model="trendFeature" placeholder="选择特征" @change="renderTrendChart">
                  <el-option v-for="feature in numericFeatures" :key="feature" :label="feature" :value="feature" />
                </el-select>
              </div>
              <div ref="trendChartRef" style="width: 100%; height: 400px;"></div>
            </div>
          </el-tab-pane>
          <el-tab-pane label="特征重要性" name="importance">
            <div class="tab-content">
              <div class="chart-controls">
                <el-select v-model="selectedModelId" placeholder="选择模型" @change="renderImportanceChart">
                  <el-option v-for="model in modelList" :key="model.id" :label="model.name" :value="model.id" />
                </el-select>
              </div>
              <div ref="importanceChartRef" style="width: 100%; height: 400px;"></div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 统计摘要 -->
      <div class="stats-section">
        <h3>统计摘要</h3>
        <el-table :data="statsData" stripe style="width: 100%">
          <el-table-column prop="feature" label="特征" width="120" />
          <el-table-column prop="count" label="数量" width="80" />
          <el-table-column prop="mean" label="均值" width="120" :formatter="formatValue" />
          <el-table-column prop="std" label="标准差" width="120" :formatter="formatValue" />
          <el-table-column prop="min" label="最小值" width="120" :formatter="formatValue" />
          <el-table-column prop="max" label="最大值" width="120" :formatter="formatValue" />
          <el-table-column prop="q25" label="25%分位数" width="120" :formatter="formatValue" />
          <el-table-column prop="q50" label="中位数" width="120" :formatter="formatValue" />
          <el-table-column prop="q75" label="75%分位数" width="120" :formatter="formatValue" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { defineComponent, ref, reactive, onMounted, nextTick } from 'vue';
import { PieChart, DataAnalysis, LineChart, TrendingUp } from '@element-plus/icons-vue';
import { ElButton, ElSelect, ElOption, ElTable, ElTableColumn, ElTabs, ElTabPane, ElRadioGroup, ElRadioButton, ElMessage } from 'element-plus';
import * as echarts from 'echarts';
import { dataService } from '../services/data.service';
import { modelService } from '../services/model.service';

export default defineComponent({
  name: 'AnalyticsView',
  components: {
    ElButton,
    ElSelect,
    ElOption,
    ElTable,
    ElTableColumn,
    ElTabs,
    ElTabPane,
    ElRadioGroup,
    ElRadioButton,
    PieChart,
    DataAnalysis,
    LineChart,
    TrendingUp
  },
  setup() {
    // 图表引用
    const distributionChartRef = ref(null);
    const correlationChartRef = ref(null);
    const trendChartRef = ref(null);
    const importanceChartRef = ref(null);
    const distributionChart = ref(null);
    const correlationChart = ref(null);
    const trendChart = ref(null);
    const importanceChart = ref(null);

    // 状态变量
    const activeTab = ref('distribution');
    const selectedFeature = ref('y');
    const trendFeature = ref('y');
    const selectedModelId = ref('');
    const chartType = ref('histogram');
    const modelList = ref([]);
    const isLoading = ref(false);

    // 数据指标
    const dataMetrics = reactive([
      { label: '数据总量', value: 200, icon: PieChart, color: '#409EFF' },
      { label: '特征数量', value: 11, icon: DataAnalysis, color: '#67C23A' },
      { label: '时间跨度', value: '24个月', icon: LineChart, color: '#E6A23C' },
      { label: 'y平均值', value: '0.623', icon: TrendingUp, color: '#F56C6C' }
    ]);

    // 数值特征列表
    const numericFeatures = [
      'y', '小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', 
      '区域特征4', '区域特征5', '区域特征6', '区域特征7', '区域特征8'
    ];

    // 统计数据
    const statsData = ref([
      {
        feature: 'y',
        count: 200,
        mean: 0.623,
        std: 0.156,
        min: 0.345,
        max: 0.892,
        q25: 0.498,
        q50: 0.635,
        q75: 0.762
      },
      {
        feature: '小区年限',
        count: 200,
        mean: 5.3,
        std: 2.1,
        min: 1,
        max: 10,
        q25: 3.5,
        q50: 5.0,
        q75: 7.0
      },
      // 其他特征的统计数据...
    ]);

    // 渲染分布图
    const renderDistributionChart = () => {
      if (!distributionChartRef.value || !selectedFeature.value) return;
      
      if (distributionChart.value) {
        distributionChart.value.dispose();
      }
      
      distributionChart.value = echarts.init(distributionChartRef.value);
      
      // 模拟数据分布
      const mockData = generateMockData(200, 0.5, 0.2);
      
      const option = {
        title: {
          text: `${selectedFeature.value} 的${chartType.value === 'histogram' ? '分布直方图' : '箱线图'}`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        }
      };
      
      if (chartType.value === 'histogram') {
        // 直方图设置
        const bins = 20;
        const min = Math.min(...mockData);
        const max = Math.max(...mockData);
        const binWidth = (max - min) / bins;
        const histogramData = new Array(bins).fill(0);
        
        mockData.forEach(value => {
          const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
          histogramData[binIndex]++;
        });
        
        option.xAxis = {
          type: 'category',
          data: Array.from({ length: bins }, (_, i) => (min + i * binWidth).toFixed(3))
        };
        option.yAxis = {
          type: 'value',
          name: '频数'
        };
        option.series = [{
          name: '频数',
          type: 'bar',
          data: histogramData,
          itemStyle: {
            color: '#409EFF'
          }
        }];
      } else {
        // 箱线图设置
        const sortedData = [...mockData].sort((a, b) => a - b);
        const n = sortedData.length;
        const q1 = sortedData[Math.floor(n * 0.25)];
        const q2 = sortedData[Math.floor(n * 0.5)];
        const q3 = sortedData[Math.floor(n * 0.75)];
        const iqr = q3 - q1;
        const lowerBound = Math.max(sortedData[0], q1 - 1.5 * iqr);
        const upperBound = Math.min(sortedData[n - 1], q3 + 1.5 * iqr);
        
        option.xAxis = {
          type: 'category',
          data: [selectedFeature.value]
        };
        option.yAxis = {
          type: 'value'
        };
        option.series = [{
          name: '箱线图',
          type: 'boxplot',
          data: [[lowerBound, q1, q2, q3, upperBound]],
          itemStyle: {
            color: '#67C23A',
            borderColor: '#67C23A'
          }
        }];
      }
      
      distributionChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (distributionChart.value) {
          distributionChart.value.resize();
        }
      });
    };

    // 渲染相关性热图
    const renderCorrelationChart = () => {
      if (!correlationChartRef.value) return;
      
      if (correlationChart.value) {
        correlationChart.value.dispose();
      }
      
      correlationChart.value = echarts.init(correlationChartRef.value);
      
      // 模拟相关系数矩阵
      const features = ['y', '小区年限', '小区饱和度', '区域特征1', '区域特征2'];
      const correlationMatrix = generateMockCorrelationMatrix(features.length);
      
      const option = {
        title: {
          text: '特征相关性矩阵',
          left: 'center'
        },
        tooltip: {
          position: 'top',
          formatter: function (params) {
            return `${features[params.data[0]]} - ${features[params.data[1]]}<br/>相关系数: ${params.data[2].toFixed(3)}`;
          }
        },
        grid: {
          height: '60%',
          top: '15%',
          left: '10%',
          right: '10%'
        },
        xAxis: {
          type: 'category',
          data: features,
          splitArea: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: features,
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: -1,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        series: [{
          name: '相关系数',
          type: 'heatmap',
          data: [],
          label: {
            show: true,
            formatter: function (params) {
              return params.data[2].toFixed(2);
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      
      // 填充相关系数数据
      for (let i = 0; i < features.length; i++) {
        for (let j = 0; j < features.length; j++) {
          option.series[0].data.push([j, i, correlationMatrix[i][j]]);
        }
      }
      
      correlationChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (correlationChart.value) {
          correlationChart.value.resize();
        }
      });
    };

    // 渲染趋势图
    const renderTrendChart = () => {
      if (!trendChartRef.value || !trendFeature.value) return;
      
      if (trendChart.value) {
        trendChart.value.dispose();
      }
      
      trendChart.value = echarts.init(trendChartRef.value);
      
      // 模拟时间序列数据
      const dates = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(2023, i, 1);
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      });
      
      const values = generateMockTimeSeries(24, 0.6, 0.15, 0.02);
      
      const option = {
        title: {
          text: `${trendFeature.value} 的时间趋势`,
          left: 'center'
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['值', '趋势线'],
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
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '值',
            type: 'line',
            data: values,
            smooth: true,
            lineStyle: {
              color: '#409EFF'
            },
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            }
          },
          {
            name: '趋势线',
            type: 'line',
            data: calculateTrendLine(values),
            smooth: true,
            lineStyle: {
              color: '#F56C6C',
              type: 'dashed'
            },
            symbol: 'none'
          }
        ]
      };
      
      trendChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (trendChart.value) {
          trendChart.value.resize();
        }
      });
    };

    // 渲染特征重要性图
    const renderImportanceChart = () => {
      if (!importanceChartRef.value) return;
      
      if (importanceChart.value) {
        importanceChart.value.dispose();
      }
      
      importanceChart.value = echarts.init(importanceChartRef.value);
      
      // 模拟特征重要性数据
      const features = ['小区年限', '小区饱和度', '区域特征1', '区域特征2', '区域特征3', '区域特征4'];
      const importanceValues = [0.25, 0.18, 0.15, 0.12, 0.1, 0.08];
      
      // 排序（降序）
      const sortedIndices = [...Array(features.length).keys()]
        .sort((a, b) => importanceValues[b] - importanceValues[a]);
      const sortedFeatures = sortedIndices.map(i => features[i]);
      const sortedImportance = sortedIndices.map(i => importanceValues[i]);
      
      const option = {
        title: {
          text: selectedModelId.value ? `模型特征重要性` : '默认模型特征重要性',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: function (params) {
            return `${params[0].name}<br/>重要性: ${(params[0].value * 100).toFixed(1)}%`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}%'
          }
        },
        yAxis: {
          type: 'category',
          data: sortedFeatures
        },
        series: [{
          name: '重要性',
          type: 'bar',
          data: sortedImportance.map(v => (v * 100).toFixed(1)),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ])
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%'
          }
        }]
      };
      
      importanceChart.value.setOption(option);
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (importanceChart.value) {
          importanceChart.value.resize();
        }
      });
    };

    // 辅助函数：生成模拟正态分布数据
    const generateMockData = (count, mean, std) => {
      const data = [];
      for (let i = 0; i < count; i++) {
        // Box-Muller 变换生成正态分布
        let u1 = 1 - Math.random();
        let u2 = 1 - Math.random();
        let z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        data.push(mean + z0 * std);
      }
      return data;
    };

    // 辅助函数：生成模拟相关系数矩阵
    const generateMockCorrelationMatrix = (size) => {
      const matrix = [];
      for (let i = 0; i < size; i++) {
        matrix[i] = [];
        for (let j = 0; j < size; j++) {
          if (i === j) {
            matrix[i][j] = 1; // 自相关为1
          } else if (j < i) {
            matrix[i][j] = matrix[j][i]; // 对称矩阵
          } else {
            // 随机生成-1到1之间的相关系数，中心元素与y的相关性略高
            let correlation = (Math.random() - 0.5) * 2;
            if (i === 0 || j === 0) { // 假设第0列是y
              correlation = correlation * 0.7 + (Math.random() > 0.5 ? 0.3 : -0.3);
            }
            matrix[i][j] = parseFloat(correlation.toFixed(3));
          }
        }
      }
      return matrix;
    };

    // 辅助函数：生成模拟时间序列数据
    const generateMockTimeSeries = (length, mean, std, trend) => {
      const data = [];
      let value = mean;
      for (let i = 0; i < length; i++) {
        // 添加趋势和随机波动
        value = value + trend + (Math.random() - 0.5) * std * 2;
        data.push(parseFloat(value.toFixed(3)));
      }
      return data;
    };

    // 辅助函数：计算简单线性趋势线
    const calculateTrendLine = (data) => {
      const n = data.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += data[i];
        sumXY += i * data[i];
        sumXX += i * i;
      }
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      const trend = [];
      for (let i = 0; i < n; i++) {
        trend.push(parseFloat((intercept + slope * i).toFixed(3)));
      }
      
      return trend;
    };

    // 格式化数值
    const formatValue = (row, column, value) => {
      if (value === null || value === undefined) return '-';
      return Number(value).toFixed(3);
    };

    // 加载模型列表
    const loadModelList = async () => {
      try {
        const response = await modelService.getModelList();
        modelList.value = response.data;
        if (modelList.value.length > 0) {
          selectedModelId.value = modelList.value[0].id;
        }
      } catch (error) {
        ElMessage.error('加载模型列表失败：' + error.message);
      }
    };

    // 监听选项卡切换
    const handleTabChange = async (tab) => {
      await nextTick();
      
      if (tab === 'distribution') {
        renderDistributionChart();
      } else if (tab === 'correlation') {
        renderCorrelationChart();
      } else if (tab === 'trend') {
        renderTrendChart();
      } else if (tab === 'importance') {
        renderImportanceChart();
      }
    };

    // 组件挂载时初始化
    onMounted(async () => {
      loadModelList();
      await nextTick();
      renderDistributionChart();
    });

    return {
      distributionChartRef,
      correlationChartRef,
      trendChartRef,
      importanceChartRef,
      activeTab,
      selectedFeature,
      trendFeature,
      selectedModelId,
      chartType,
      modelList,
      dataMetrics,
      statsData,
      numericFeatures,
      renderDistributionChart,
      renderCorrelationChart,
      renderTrendChart,
      renderImportanceChart,
      formatValue,
      handleTabChange
    };
  }
});
</script>

<style scoped>
.analytics-view-container {
  padding: 20px;
}

.overview-section h3,
.stats-section h3 {
  margin-bottom: 20px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  margin-bottom: 20px;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.metric-icon :deep(.el-icon) {
  font-size: 24px;
}

.metric-content {
  flex: 1;
}

.metric-label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.metric-value {
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.analysis-tabs {
  margin-top: 30px;
}

.tab-content {
  padding: 20px 0;
}

.chart-controls {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.chart-controls :deep(.el-select),
.chart-controls :deep(.el-radio-group) {
  width: auto;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
  }
  
  .chart-controls :deep(.el-select) {
    width: 100%;
  }
}
</style>