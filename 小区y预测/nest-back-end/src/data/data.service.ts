import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

@Injectable()
export class DataService {
  private readonly uploadPath = path.join(__dirname, '../../uploads');

  constructor() {
    // 确保上传目录存在
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * 处理上传的CSV文件
   */
  async processCsvFile(file: Express.Multer.File): Promise<any[]> {
    try {
      // 保存上传的文件
      const savedFilePath = path.join(this.uploadPath, file.originalname);
      await promisify(fs.writeFile)(savedFilePath, file.buffer);

      // 解析CSV文件
      const data = await this.parseCsv(savedFilePath);
      return data;
    } catch (error) {
      throw new HttpException(
        `文件处理失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 解析CSV文件内容
   */
  private async parseCsv(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      const parser = parse({
        delimiter: ',',
        columns: true,
        skip_empty_lines: true,
      });

      const stream = createReadStream(filePath).pipe(parser);

      stream.on('data', (data) => results.push(data));
      stream.on('end', () => resolve(results));
      stream.on('error', (error) => reject(error));
    });
  }

  /**
   * 获取原始示例数据
   */
  async getSampleData(): Promise<any[]> {
    try {
      const sampleFilePath = 'd:/Desktop/MY/TensorFlow机器学习/小区y预测/originData/originData.csv';
      if (!fs.existsSync(sampleFilePath)) {
        throw new HttpException('示例数据文件不存在', HttpStatus.NOT_FOUND);
      }
      
      return this.parseCsv(sampleFilePath);
    } catch (error) {
      throw new HttpException(
        `获取示例数据失败: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 数据预处理主函数
   */
  preprocessData(data: any[], options?: PreprocessOptions): any[] {
    let processedData = [...data];
    
    // 默认选项
    const defaultOptions: PreprocessOptions = {
      convertNumeric: true,
      handleMissing: true,
      detectOutliers: false,
      normalize: false,
      createTimeFeatures: true,
      ...options,
    };

    // 1. 类型转换
    if (defaultOptions.convertNumeric) {
      processedData = this.convertDataTypes(processedData);
    }

    // 2. 创建时间特征
    if (defaultOptions.createTimeFeatures) {
      processedData = this.createTimeBasedFeatures(processedData);
    }

    // 3. 处理缺失值
    if (defaultOptions.handleMissing) {
      processedData = this.handleMissingValues(processedData, defaultOptions.missingValueStrategy);
    }

    // 4. 检测和处理异常值
    if (defaultOptions.detectOutliers) {
      processedData = this.handleOutliers(processedData, defaultOptions.outlierFields, defaultOptions.outlierStrategy);
    }

    // 5. 特征标准化/归一化
    if (defaultOptions.normalize) {
      processedData = this.normalizeFeatures(processedData, defaultOptions.normalizeFields, defaultOptions.normalizeMethod);
    }

    return processedData;
  }

  /**
   * 数据类型转换
   */
  convertDataTypes(data: any[]): any[] {
    return data.map(row => {
      const processedRow: any = {};
      
      Object.keys(row).forEach(key => {
        const value = row[key];
        // 尝试转换为数值
        if (!isNaN(value) && value !== '' && value !== null) {
          processedRow[key] = Number(value);
        } else if (value === '0' || value === '1') {
          // 布尔值转换
          processedRow[key] = value === '1';
        } else {
          // 保留原始值
          processedRow[key] = value;
        }
      });

      return processedRow;
    });
  }

  /**
   * 创建时间相关特征
   */
  createTimeBasedFeatures(data: any[]): any[] {
    return data.map(row => {
      const processedRow = { ...row };
      
      // 处理年月字段
      if (processedRow['年月']) {
        const yearMonth = String(processedRow['年月']);
        if (yearMonth.length === 6) {
          const year = Number(yearMonth.substring(0, 4));
          const month = Number(yearMonth.substring(4, 6));
          
          processedRow['年'] = year;
          processedRow['月'] = month;
          
          // 添加季节特征
          if (month >= 3 && month <= 5) processedRow['季节'] = 1; // 春季
          else if (month >= 6 && month <= 8) processedRow['季节'] = 2; // 夏季
          else if (month >= 9 && month <= 11) processedRow['季节'] = 3; // 秋季
          else processedRow['季节'] = 4; // 冬季
          
          // 添加季度特征
          processedRow['季度'] = Math.ceil(month / 3);
          
          // 添加月份的正弦和余弦特征（用于捕捉周期性）
          processedRow['月_sin'] = Math.sin(2 * Math.PI * month / 12);
          processedRow['月_cos'] = Math.cos(2 * Math.PI * month / 12);
          
          // 添加年份的相对值
          const baseYear = 2020; // 假设基准年份
          processedRow['年份相对值'] = year - baseYear;
        }
      }
      
      return processedRow;
    });
  }

  /**
   * 处理缺失值
   */
  handleMissingValues(data: any[], strategy: 'mean' | 'median' | 'mode' | 'drop' = 'mean'): any[] {
    if (strategy === 'drop') {
      // 移除含有缺失值的行
      return data.filter(row => {
        return Object.values(row).every(val => val !== undefined && val !== null && val !== '');
      });
    }

    // 计算各数值列的统计量
    const statistics = this.calculateStatistics(data);
    
    return data.map(row => {
      const processedRow = { ...row };
      
      Object.keys(processedRow).forEach(key => {
        const value = processedRow[key];
        // 检查是否为缺失值
        if (value === undefined || value === null || value === '') {
          // 只有数值列才进行填充
          if (statistics[key] && typeof statistics[key].mean === 'number') {
            if (strategy === 'mean') {
              processedRow[key] = statistics[key].mean;
            } else if (strategy === 'median') {
              processedRow[key] = statistics[key].median;
            } else if (strategy === 'mode') {
              processedRow[key] = statistics[key].mode;
            }
          } else {
            // 非数值列用空字符串填充
            processedRow[key] = '';
          }
        }
      });
      
      return processedRow;
    });
  }

  /**
   * 检测和处理异常值
   */
  handleOutliers(data: any[], fields?: string[], strategy: 'clip' | 'remove' | 'replace' = 'clip'): any[] {
    // 确定要检查的字段
    const numericFields = fields || this.getNumericFields(data);
    
    // 计算各字段的四分位数
    const quartiles = {};
    numericFields.forEach(field => {
      quartiles[field] = this.calculateQuartiles(data.map(row => row[field]).filter(val => typeof val === 'number'));
    });

    // 处理异常值
    if (strategy === 'remove') {
      return data.filter(row => {
        return numericFields.every(field => {
          const value = row[field];
          if (typeof value !== 'number') return true;
          
          const q1 = quartiles[field].q1;
          const q3 = quartiles[field].q3;
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          
          return value >= lowerBound && value <= upperBound;
        });
      });
    }

    return data.map(row => {
      const processedRow = { ...row };
      
      numericFields.forEach(field => {
        const value = processedRow[field];
        if (typeof value !== 'number') return;
        
        const q1 = quartiles[field].q1;
        const q3 = quartiles[field].q3;
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;
        
        if (strategy === 'clip') {
          // 截断到边界
          if (value < lowerBound) processedRow[field] = lowerBound;
          if (value > upperBound) processedRow[field] = upperBound;
        } else if (strategy === 'replace') {
          // 替换为中位数
          if (value < lowerBound || value > upperBound) {
            processedRow[field] = quartiles[field].median;
          }
        }
      });
      
      return processedRow;
    });
  }

  /**
   * 特征标准化/归一化
   */
  normalizeFeatures(data: any[], fields?: string[], method: 'minmax' | 'zscore' = 'minmax'): any[] {
    const numericFields = fields || this.getNumericFields(data);
    const stats = {};
    
    // 计算统计量
    numericFields.forEach(field => {
      const values = data.map(row => row[field]).filter(val => typeof val === 'number');
      const min = Math.min(...values);
      const max = Math.max(...values);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      
      stats[field] = { min, max, mean, std };
    });

    return data.map(row => {
      const processedRow = { ...row };
      
      numericFields.forEach(field => {
        const value = processedRow[field];
        if (typeof value !== 'number') return;
        
        if (method === 'minmax') {
          // 最小-最大归一化
          const { min, max } = stats[field];
          if (max !== min) {
            processedRow[field] = (value - min) / (max - min);
          }
        } else if (method === 'zscore') {
          // Z-score标准化
          const { mean, std } = stats[field];
          if (std !== 0) {
            processedRow[field] = (value - mean) / std;
          }
        }
      });
      
      return processedRow;
    });
  }

  /**
   * 计算数据集的统计信息
   */
  calculateStatistics(data: any[]): any {
    const statistics: any = {};
    
    if (data.length === 0) return statistics;
    
    const fields = Object.keys(data[0]);
    
    fields.forEach(field => {
      const values = data.map(row => row[field]).filter(val => typeof val === 'number' && !isNaN(val));
      
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = sorted[Math.floor(sorted.length / 2)];
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        
        // 计算众数
        const frequency: any = {};
        values.forEach(val => {
          frequency[val] = (frequency[val] || 0) + 1;
        });
        let mode = values[0];
        let maxFreq = 1;
        Object.entries(frequency).forEach(([val, freq]) => {
          if ((freq as number) > maxFreq) {
            mode = Number(val);
            maxFreq = freq as number;
          }
        });
        
        statistics[field] = { mean, median, mode, min, max, count: values.length };
      }
    });
    
    return statistics;
  }

  /**
   * 获取数据集中的数值字段
   */
  getNumericFields(data: any[]): string[] {
    if (data.length === 0) return [];
    
    const fields = Object.keys(data[0]);
    const numericFields: string[] = [];
    
    fields.forEach(field => {
      // 检查是否大多数值都是数值
      const numericCount = data.filter(row => {
        const val = row[field];
        return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)));
      }).length;
      
      // 如果超过80%的值是数值，则认为是数值字段
      if (numericCount / data.length > 0.8) {
        numericFields.push(field);
      }
    });
    
    return numericFields;
  }

  /**
   * 计算四分位数
   */
  calculateQuartiles(values: number[]): { q1: number, median: number, q3: number } {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    
    const medianIndex = Math.floor(n / 2);
    const median = n % 2 === 0 ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2 : sorted[medianIndex];
    
    const lowerHalf = sorted.slice(0, medianIndex);
    const upperHalf = n % 2 === 0 ? sorted.slice(medianIndex) : sorted.slice(medianIndex + 1);
    
    const q1Index = Math.floor(lowerHalf.length / 2);
    const q1 = lowerHalf.length % 2 === 0 ? 
      (lowerHalf[q1Index - 1] + lowerHalf[q1Index]) / 2 : lowerHalf[q1Index];
    
    const q3Index = Math.floor(upperHalf.length / 2);
    const q3 = upperHalf.length % 2 === 0 ? 
      (upperHalf[q3Index - 1] + upperHalf[q3Index]) / 2 : upperHalf[q3Index];
    
    return { q1, median, q3 };
  }

  /**
   * 特征选择
   */
  selectFeatures(data: any[], selectedFeatures: string[]): any[] {
    return data.map(row => {
      const selectedRow: any = {};
      selectedFeatures.forEach(feature => {
        if (row[feature] !== undefined) {
          selectedRow[feature] = row[feature];
        }
      });
      return selectedRow;
    });
  }

  /**
   * 拆分数据集为训练集和测试集
   */
  splitData(data: any[], testRatio: number = 0.2, splitMethod: 'time' | 'random' = 'time'): { train: any[], test: any[] } {
    if (splitMethod === 'time') {
      const sortedData = [...data].sort((a, b) => {
        // 按年月排序
        const dateA = a['年月'] || a['日期'] || 0;
        const dateB = b['年月'] || b['日期'] || 0;
        return dateA - dateB;
      });

      const testSize = Math.floor(sortedData.length * testRatio);
      const trainSize = sortedData.length - testSize;

      return {
        train: sortedData.slice(0, trainSize),
        test: sortedData.slice(trainSize),
      };
    } else {
      // 随机拆分
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const testSize = Math.floor(shuffled.length * testRatio);
      
      return {
        train: shuffled.slice(0, shuffled.length - testSize),
        test: shuffled.slice(shuffled.length - testSize),
      };
    }
  }

  /**
   * 计算特征相关性
   */
  calculateCorrelation(data: any[], targetField: string): { [field: string]: number } {
    const correlations: any = {};
    const numericFields = this.getNumericFields(data);
    
    numericFields.forEach(field => {
      if (field === targetField) return;
      
      // 过滤掉NaN值
      const validPairs = data.filter(row => {
        return typeof row[field] === 'number' && typeof row[targetField] === 'number' &&
               !isNaN(row[field]) && !isNaN(row[targetField]);
      });
      
      if (validPairs.length < 2) {
        correlations[field] = 0;
        return;
      }
      
      // 计算协方差和标准差
      const n = validPairs.length;
      const sumX = validPairs.reduce((sum, row) => sum + row[field], 0);
      const sumY = validPairs.reduce((sum, row) => sum + row[targetField], 0);
      const sumXY = validPairs.reduce((sum, row) => sum + row[field] * row[targetField], 0);
      const sumX2 = validPairs.reduce((sum, row) => sum + row[field] * row[field], 0);
      const sumY2 = validPairs.reduce((sum, row) => sum + row[targetField] * row[targetField], 0);
      
      const covariance = (n * sumXY - sumX * sumY) / (n * n);
      const stdX = Math.sqrt((n * sumX2 - sumX * sumX) / (n * n));
      const stdY = Math.sqrt((n * sumY2 - sumY * sumY) / (n * n));
      
      // 计算皮尔逊相关系数
      if (stdX > 0 && stdY > 0) {
        correlations[field] = covariance / (stdX * stdY);
      } else {
        correlations[field] = 0;
      }
    });
    
    return correlations;
  }

  /**
   * 特征重要性分析（基于相关性）
   */
  analyzeFeatureImportance(data: any[], targetField: string): { field: string, importance: number }[] {
    const correlations = this.calculateCorrelation(data, targetField);
    
    return Object.entries(correlations)
      .map(([field, corr]) => ({ field, importance: Math.abs(corr) }))
      .sort((a, b) => b.importance - a.importance);
  }

  /**
   * 创建滞后特征
   */
  createLagFeatures(data: any[], fields: string[], lagSteps: number[] = [1, 3, 6, 12]): any[] {
    // 按年月排序
    const sortedData = [...data].sort((a, b) => {
      const dateA = a['年月'] || a['日期'] || 0;
      const dateB = b['年月'] || b['日期'] || 0;
      return dateA - dateB;
    });
    
    // 为每个小区创建滞后特征
    const communityGroups = this.groupByCommunity(sortedData);
    const result: any[] = [];
    
    Object.values(communityGroups).forEach(communityData => {
      communityData.forEach((row, index) => {
        const enhancedRow = { ...row };
        
        fields.forEach(field => {
          lagSteps.forEach(lag => {
            if (index - lag >= 0) {
              enhancedRow[`${field}_lag_${lag}`] = communityData[index - lag][field];
            }
          });
        });
        
        result.push(enhancedRow);
      });
    });
    
    return result;
  }

  /**
   * 按小区分组数据
   */
  groupByCommunity(data: any[]): { [communityId: string]: any[] } {
    const groups: any = {};
    
    data.forEach(row => {
      const communityId = row['小区ID'] || 'unknown';
      if (!groups[communityId]) {
        groups[communityId] = [];
      }
      groups[communityId].push(row);
    });
    
    return groups;
  }

  /**
   * 创建滚动统计特征
   */
  createRollingFeatures(data: any[], fields: string[], windows: number[] = [3, 6, 12]): any[] {
    // 按年月排序
    const sortedData = [...data].sort((a, b) => {
      const dateA = a['年月'] || a['日期'] || 0;
      const dateB = b['年月'] || b['日期'] || 0;
      return dateA - dateB;
    });
    
    // 为每个小区创建滚动特征
    const communityGroups = this.groupByCommunity(sortedData);
    const result: any[] = [];
    
    Object.values(communityGroups).forEach(communityData => {
      communityData.forEach((row, index) => {
        const enhancedRow = { ...row };
        
        fields.forEach(field => {
          windows.forEach(window => {
            if (index >= window - 1) {
              const windowData = communityData.slice(index - window + 1, index + 1);
              const values = windowData.map(item => item[field]).filter(val => typeof val === 'number');
              
              if (values.length > 0) {
                enhancedRow[`${field}_rolling_mean_${window}`] = values.reduce((sum, val) => sum + val, 0) / values.length;
                enhancedRow[`${field}_rolling_min_${window}`] = Math.min(...values);
                enhancedRow[`${field}_rolling_max_${window}`] = Math.max(...values);
                
                // 计算标准差
                const mean = enhancedRow[`${field}_rolling_mean_${window}`];
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
                enhancedRow[`${field}_rolling_std_${window}`] = Math.sqrt(variance);
              }
            }
          });
        });
        
        result.push(enhancedRow);
      });
    });
    
    return result;
  }
}

/**
 * 数据预处理选项接口
 */
interface PreprocessOptions {
  convertNumeric?: boolean;
  handleMissing?: boolean;
  missingValueStrategy?: 'mean' | 'median' | 'mode' | 'drop';
  detectOutliers?: boolean;
  outlierFields?: string[];
  outlierStrategy?: 'clip' | 'remove' | 'replace';
  normalize?: boolean;
  normalizeFields?: string[];
  normalizeMethod?: 'minmax' | 'zscore';
  createTimeFeatures?: boolean;
}