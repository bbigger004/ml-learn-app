<template>
  <div id="app">
    <el-container class="app-container">
      <!-- 头部导航 -->
      <el-header class="app-header">
        <div class="header-content">
          <h1 class="app-title">
            <el-icon><TrendCharts /></el-icon>
            小区y值预测系统
          </h1>
          <el-menu
            :default-active="activeIndex"
            class="nav-menu"
            mode="horizontal"
            router
            @select="handleSelect"
          >
            <el-menu-item index="/data-upload">
              <el-icon><Upload /></el-icon>
              数据上传
            </el-menu-item>
            <el-menu-item index="/feature-selection">
              <el-icon><SetUp /></el-icon>
              特征选择
            </el-menu-item>
            <el-menu-item index="/model-training">
              <el-icon><Cpu /></el-icon>
              模型训练
            </el-menu-item>
            <el-menu-item index="/prediction">
              <el-icon><DataAnalysis /></el-icon>
              预测结果
            </el-menu-item>
          </el-menu>
        </div>
      </el-header>

      <!-- 主要内容区域 -->
      <el-main class="app-main">
        <router-view />
      </el-main>

      <!-- 底部信息 -->
      <el-footer class="app-footer">
        <div class="footer-content">
          <span>小区y值预测系统 © 2024</span>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeIndex = ref('/data-upload')

// 监听路由变化，更新激活菜单项
watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath
  },
  { immediate: true }
)

const handleSelect = (key: string) => {
  activeIndex.value = key
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  background-color: #f5f7fa;
}

.app-header {
  background-color: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.app-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 20px;
  color: #409eff;
  font-weight: 600;
}

.app-title .el-icon {
  margin-right: 8px;
}

.nav-menu {
  border-bottom: none;
}

.app-main {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-top: 20px;
  margin-bottom: 20px;
}

.app-footer {
  background-color: #fff;
  border-top: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  font-size: 14px;
}

.footer-content {
  max-width: 1200px;
  width: 100%;
  text-align: center;
  padding: 0 20px;
}
</style>