import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/data-upload'
    },
    {
      path: '/data-upload',
      name: 'DataUpload',
      component: () => import('@/views/DataUpload.vue')
    },
    {
      path: '/feature-selection',
      name: 'FeatureSelection',
      component: () => import('@/views/FeatureSelection.vue')
    },
    {
      path: '/model-training',
      name: 'ModelTraining',
      component: () => import('@/views/ModelTraining.vue')
    },
    {
      path: '/prediction',
      name: 'Prediction',
      component: () => import('@/views/Prediction.vue')
    }
  ]
})

export default router