<template>
  <div class="home-container">
    <div class="hero-section">
      <h1 class="title">小区y值预测系统</h1>
      <p class="subtitle">基于机器学习的时间序列预测解决方案</p>
      <div class="action-buttons">
        <el-button type="primary" size="large" @click="navigateTo('/data')">
          <el-icon><Upload /></el-icon>
          上传数据
        </el-button>
        <el-button type="success" size="large" @click="navigateTo('/prediction')">
          <el-icon><TrendCharts /></el-icon>
          查看预测
        </el-button>
      </div>
    </div>

    <div class="features-section">
      <h2 class="section-title">核心功能</h2>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">
            <el-icon class="icon-large"><Document /></el-icon>
          </div>
          <h3>数据管理</h3>
          <p>上传CSV数据集，预览和预处理数据，支持多小区数据管理</p>
          <el-button type="link" @click="navigateTo('/data')">了解更多</el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon class="icon-large"><Cpu /></el-icon>
          </div>
          <h3>模型训练</h3>
          <p>使用LSTM深度学习算法训练预测模型，支持参数调整和模型评估</p>
          <el-button type="link" @click="navigateTo('/model')">了解更多</el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon class="icon-large"><TrendCharts /></el-icon>
          </div>
          <h3>预测分析</h3>
          <p>预测未来6个月y值，可视化展示预测结果，支持多模型对比分析</p>
          <el-button type="link" @click="navigateTo('/prediction')">了解更多</el-button>
        </div>

        <div class="feature-card">
          <div class="feature-icon">
            <el-icon class="icon-large"><PieChart /></el-icon>
          </div>
          <h3>数据分析</h3>
          <p>特征重要性分析，数据分布统计，历史趋势可视化展示</p>
          <el-button type="link" @click="navigateTo('/analysis')">了解更多</el-button>
        </div>
      </div>
    </div>

    <div class="about-section">
      <h2 class="section-title">关于系统</h2>
      <p class="about-text">
        本系统基于NestJS后端框架和Vue3前端框架开发，集成TensorFlow.js实现机器学习功能。
        系统采用LSTM（长短期记忆网络）算法对小区y值进行时间序列预测，帮助用户了解未来6个月的趋势变化。
        系统支持数据上传、模型训练、参数调整、预测结果可视化等功能，操作简单直观。
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { Upload, TrendCharts, Document, Cpu, PieChart } from '@element-plus/icons-vue';
import { ElButton } from 'element-plus';

export default defineComponent({
  name: 'HomeView',
  components: {
    ElButton,
    Upload,
    TrendCharts,
    Document,
    Cpu,
    PieChart
  },
  setup() {
    const router = useRouter();

    const navigateTo = (path) => {
      router.push(path);
    };

    return {
      navigateTo
    };
  }
});
</script>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.hero-section {
  text-align: center;
  padding: 80px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 16px;
  margin-bottom: 40px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.title {
  font-size: 2.5rem;
  margin-bottom: 16px;
  font-weight: 700;
}

.subtitle {
  font-size: 1.2rem;
  margin-bottom: 32px;
  opacity: 0.9;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.features-section {
  margin-bottom: 60px;
}

.section-title {
  text-align: center;
  font-size: 1.8rem;
  margin-bottom: 32px;
  color: #333;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.feature-card {
  background: white;
  padding: 32px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0,  00, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.feature-icon {
  margin-bottom: 20px;
  color: #667eea;
}

.icon-large {
  font-size: 2.5rem;
}

.feature-card h3 {
  font-size: 1.3rem;
  margin-bottom: 12px;
  color: #333;
}

.feature-card p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.about-section {
  background: #f8f9fa;
  padding: 40px;
  border-radius: 12px;
  text-align: center;
}

.about-text {
  line-height: 1.8;
  color: #666;
  max-width: 800px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 20px;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>