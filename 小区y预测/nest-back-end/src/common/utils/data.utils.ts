import { CommunityData, PreprocessedData } from '../interfaces/data.interface';

/**
 * 将年月字符串转换为Date对象
 * @param yearMonthStr 年月字符串，格式如 '2023-04'
 * @returns Date对象
 */
export function parseYearMonth(yearMonthStr: string): Date {
  const [year, month] = yearMonthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

/**
 * 将Date对象转换为年月字符串
 * @param date Date对象
 * @returns 年月字符串，格式如 '2023-04'
 */
export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 获取未来几个月的年月字符串数组
 * @param startDate 起始日期
 * @param months 月数
 * @returns 年月字符串数组
 */
export function getFutureMonths(startDate: Date | string, months: number): string[] {
  const start = typeof startDate === 'string' ? parseYearMonth(startDate) : startDate;
  const result: string[] = [];
  
  for (let i = 1; i <= months; i++) {
    const date = new Date(start);
    date.setMonth(date.getMonth() + i);
    result.push(formatYearMonth(date));
  }
  
  return result;
}

/**
 * 标准化数据
 * @param data 原始数据
 * @param statistics 统计信息，如果不提供则自动计算
 * @returns 标准化后的数据和统计信息
 */
export function normalizeData(data: any[], statistics?: PreprocessedData['statistics']): { normalized: any[], statistics: PreprocessedData['statistics'] } {
  const featureNames = Object.keys(data[0]).filter(key => typeof data[0][key] === 'number');
  const result: any[] = [];
  
  // 如果没有提供统计信息，则计算
  if (!statistics) {
    statistics = {
      mean: {},
      std: {},
      min: {},
      max: {}
    };
    
    // 初始化统计信息
    featureNames.forEach(feature => {
      const values = data.map(item => item[feature] as number);
      statistics!.mean[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
      statistics!.std[feature] = Math.sqrt(
        values.reduce((sum, val) => sum + Math.pow(val - statistics!.mean![feature]!, 2), 0) / values.length
      );
      statistics!.min[feature] = Math.min(...values);
      statistics!.max[feature] = Math.max(...values);
    });
  }
  
  // 应用标准化
  data.forEach(item => {
    const normalizedItem: any = { ...item };
    featureNames.forEach(feature => {
      // 如果标准差为0，则使用min-max标准化
      if (statistics!.std![feature] === 0) {
        if (statistics!.max![feature] === statistics!.min![feature]) {
          normalizedItem[feature] = 0;
        } else {
          normalizedItem[feature] = (item[feature] - statistics!.min![feature]) / 
            (statistics!.max![feature] - statistics!.min![feature]);
        }
      } else {
        normalizedItem[feature] = (item[feature] - statistics!.mean![feature]) / statistics!.std![feature];
      }
    });
    result.push(normalizedItem);
  });
  
  return { normalized: result, statistics };
}

/**
 * 反标准化数据
 * @param normalizedData 标准化后的数据
 * @param statistics 统计信息
 * @param features 需要反标准化的特征
 * @returns 反标准化后的数据
 */
export function denormalizeData(normalizedData: any[], statistics: PreprocessedData['statistics'], features: string[]): any[] {
  const result: any[] = [];
  
  normalizedData.forEach(item => {
    const denormalizedItem: any = { ...item };
    features.forEach(feature => {
      if (statistics && statistics.std && statistics.mean && statistics.max && statistics.min) {
        // 如果标准差为0，则使用min-max反标准化
        if (statistics.std[feature] === 0) {
          denormalizedItem[feature] = statistics.min[feature];
        } else {
          denormalizedItem[feature] = (item[feature] * statistics.std[feature]) + statistics.mean[feature];
        }
      }
    });
    result.push(denormalizedItem);
  });
  
  return result;
}

/**
 * 为时间序列数据创建滞后特征
 * @param data 原始数据
 * @param lookBack 滞后窗口大小
 * @param features 需要创建滞后特征的属性
 * @returns 添加了滞后特征的数据
 */
export function createLagFeatures(data: CommunityData[], lookBack: number, features: string[]): any[] {
  const result: any[] = [];
  
  // 按小区ID分组
  const groupedByCommunity: Record<string, CommunityData[]> = {};
  data.forEach(item => {
    if (!groupedByCommunity[item['小区ID']]) {
      groupedByCommunity[item['小区ID']] = [];
    }
    groupedByCommunity[item['小区ID']].push(item);
  });
  
  // 为每个小区创建滞后特征
  Object.values(groupedByCommunity).forEach(communityData => {
    // 按时间排序
    communityData.sort((a, b) => a['年月'].localeCompare(b['年月']));
    
    // 为每个时间点创建滞后特征
    for (let i = lookBack; i < communityData.length; i++) {
      const item = { ...communityData[i] };
      
      // 添加滞后特征
      for (let j = 1; j <= lookBack; j++) {
        features.forEach(feature => {
          if (communityData[i - j] && typeof communityData[i - j][feature] === 'number') {
            item[`${feature}_lag_${j}`] = communityData[i - j][feature];
          }
        });
      }
      
      result.push(item);
    }
  });
  
  return result;
}

/**
 * 计算评估指标
 * @param actual 实际值
 * @param predicted 预测值
 * @returns 评估指标
 */
export function calculateMetrics(actual: number[], predicted: number[]): {
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
} {
  const n = actual.length;
  
  // 计算MAE
  const mae = actual.reduce((sum, val, i) => sum + Math.abs(val - predicted[i]), 0) / n;
  
  // 计算MSE
  const mse = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) / n;
  
  // 计算RMSE
  const rmse = Math.sqrt(mse);
  
  // 计算R2
  const actualMean = actual.reduce((sum, val) => sum + val, 0) / n;
  const ssRes = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  const ssTot = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  return { mae, mse, rmse, r2 };
}