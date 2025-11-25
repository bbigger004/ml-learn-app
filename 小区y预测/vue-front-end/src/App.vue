<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  HomeFilled,
  Document,
  Cpu,
  DataLine,
  PieChart,
  TrendCharts,
  Menu,
} from '@element-plus/icons-vue';
import { ElContainer, ElAside, ElMenu, ElMenuItem, ElMain, ElButton } from 'element-plus';

const router = useRouter();
const route = useRoute();
const collapsed = ref(false);

const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
};

const menuItems = [
  {
    path: '/',
    name: 'home',
    label: '首页',
    icon: HomeFilled
  },
  {
    path: '/data',
    name: 'data',
    label: '数据管理',
    icon: Document
  },
  {
    path: '/model',
    name: 'model',
    label: '模型管理',
    icon: Cpu
  },
  {
    path: '/prediction',
    name: 'prediction',
    label: '预测结果',
    icon: TrendCharts
  },
  {
    path: '/evaluation',
    name: 'evaluation',
    label: '模型评估',
    icon: DataLine
  },
  {
    path: '/analysis',
    name: 'analysis',
    label: '数据分析',
    icon: PieChart
  }
];

const activePath ="";
//  computed((route) => {
//   return route.path;
// });
</script>

<template>
  <el-container class="app-container">
    <el-aside :width="collapsed ? '64px' : '240px'" class="app-aside" :class="{ 'collapsed': collapsed }">
      <div class="aside-header">
        <div class="logo" :class="{ 'hidden': collapsed }">
          <span class="logo-text">小区y预测</span>
        </div>
        <ElButton 
          type="text" 
          icon="Menu" 
          :icon="collapsed ? Menu : Menu"
          @click="toggleCollapse"
          class="toggle-btn"
        />
      </div>
      <el-menu
        :collapse="collapsed"
        :default-active="activePath"
        class="app-menu"
        router
        :collapse-transition="false"
      >
        <el-menu-item
          v-for="item in menuItems"
          :key="item.path"
          :index="item.path"
          class="menu-item"
        >
          <template #icon>
            <component :is="item.icon" />
          </template>
          <template #title>{{ item.label }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container class="main-container">
      <el-main class="app-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  height: 100%;
  background-color: #f5f7fa;
}

.app-container {
  height: 100%;
  background-color: #f5f7fa;
}

.app-aside {
  background-color: #001529;
  color: #fff;
  transition: width 0.3s ease;
  overflow-x: hidden;
}

.aside-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 60px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  transition: opacity 0.3s ease;
}

.logo.hidden {
  opacity: 0;
  width: 0;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.toggle-btn {
  color: #fff;
  font-size: 18px;
}

.app-menu {
  background-color: transparent;
  border-right: none;
}

.menu-item {
  transition: all 0.3s ease;
}

.menu-item:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.menu-item.is-active {
  background-color: #1890ff !important;
}

.main-container {
  background-color: #f5f7fa;
}

.app-main {
  padding: 20px;
  background-color: #f5f7fa;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-aside {
    position: fixed;
    height: 100%;
    z-index: 1000;
  }
}
</style>
