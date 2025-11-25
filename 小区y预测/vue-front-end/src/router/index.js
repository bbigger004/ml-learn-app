import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: {
      title: '首页 - 小区y预测系统'
    }
  },
  {
    path: '/data',
    name: 'data',
    component: () => import('../views/DataView.vue'),
    meta: {
      title: '数据管理 - 小区y预测系统'
    }
  },
  {
    path: '/model',
    name: 'model',
    component: () => import('../views/ModelView.vue'),
    meta: {
      title: '模型管理 - 小区y预测系统'
    }
  },
  {
    path: '/prediction',
    name: 'prediction',
    component: () => import('../views/PredictionView.vue'),
    meta: {
      title: '预测结果 - 小区y预测系统'
    }
  },
  {
    path: '/evaluation',
    name: 'evaluation',
    component: () => import('../views/ModelEvaluation.vue'),
    meta: {
      title: '模型评估 - 小区y预测系统'
    }
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('../views/AnalyticsView.vue'),
    meta: {
      title: '数据分析 - 小区y预测系统'
    }
  },
  {
    // 捕获所有未匹配的路由
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
    meta: {
      title: '页面不存在'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 全局前置守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

export default router;