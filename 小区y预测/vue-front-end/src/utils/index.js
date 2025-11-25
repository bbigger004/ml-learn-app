import { ElMessage } from 'element-plus';

/**
 * 通用工具函数集合
 */

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {Object} options - 格式化选项
 * @returns {string} 格式化后的日期字符串
 */
export const formatDateTime = (date, options = {}) => {
  if (!date) return '-';
  const defaultOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  return new Date(date).toLocaleString('zh-CN', mergedOptions);
};

/**
 * 格式化年月
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式为"YYYY-MM"的字符串
 */
export const formatYearMonth = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * 格式化数字，保留指定位数小数
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数，默认2位
 * @returns {string} 格式化后的数字字符串
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  if (typeof value !== 'number') {
    value = parseFloat(value);
  }
  if (isNaN(value)) return '-';
  return value.toFixed(decimals);
};

/**
 * 格式化大数字（添加千位分隔符）
 * @param {number} value - 数值
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的数字字符串
 */
export const formatLargeNumber = (value, decimals = 0) => {
  if (value === null || value === undefined) return '-';
  if (typeof value !== 'number') {
    value = parseFloat(value);
  }
  if (isNaN(value)) return '-';
  
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * 格式化百分比
 * @param {number} value - 数值（小数形式）
 * @param {number} decimals - 小数位数
 * @returns {string} 格式化后的百分比字符串
 */
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '-';
  if (typeof value !== 'number') {
    value = parseFloat(value);
  }
  if (isNaN(value)) return '-';
  
  return (value * 100).toFixed(decimals) + '%';
};

/**
 * 深拷贝对象
 * @param {Object} obj - 要拷贝的对象
 * @returns {Object} 拷贝后的新对象
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  
  const clonedObj = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
};

/**
 * 生成随机ID
 * @param {number} length - ID长度
 * @returns {string} 随机ID
 */
export const generateId = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * 节流函数
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} 节流后的函数
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * 检查是否为空值（null, undefined, 空字符串, 空数组, 空对象）
 * @param {*} value - 要检查的值
 * @returns {boolean} 是否为空
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
};

/**
 * 生成指定范围的随机数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @param {boolean} isInteger - 是否为整数
 * @returns {number} 随机数
 */
export const random = (min, max, isInteger = false) => {
  const num = Math.random() * (max - min) + min;
  return isInteger ? Math.floor(num) : num;
};

/**
 * 计算数组的平均值
 * @param {Array} arr - 数字数组
 * @returns {number} 平均值
 */
export const average = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  return sum / arr.length;
};

/**
 * 计算数组的总和
 * @param {Array} arr - 数字数组
 * @returns {number} 总和
 */
export const sum = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
};

/**
 * 计算数组的最大值
 * @param {Array} arr - 数字数组
 * @returns {number} 最大值
 */
export const max = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return Math.max(...arr.map(val => parseFloat(val) || -Infinity));
};

/**
 * 计算数组的最小值
 * @param {Array} arr - 数字数组
 * @returns {number} 最小值
 */
export const min = (arr) => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return Math.min(...arr.map(val => parseFloat(val) || Infinity));
};

/**
 * 错误处理函数
 * @param {Error} error - 错误对象
 * @param {string} message - 自定义错误消息
 */
export const handleError = (error, message = '操作失败') => {
  console.error(message, error);
  
  // 根据不同的错误类型显示相应的提示
  if (error.response) {
    // 服务器返回错误状态码
    ElMessage.error(`${message}：${error.response.data.message || '服务器错误'}`);
  } else if (error.request) {
    // 请求发送失败
    ElMessage.error(`${message}：网络错误，请检查您的网络连接`);
  } else {
    // 其他错误
    ElMessage.error(`${message}：${error.message}`);
  }
};

/**
 * 成功提示函数
 * @param {string} message - 成功消息
 */
export const showSuccess = (message = '操作成功') => {
  ElMessage.success(message);
};

/**
 * 警告提示函数
 * @param {string} message - 警告消息
 */
export const showWarning = (message = '警告') => {
  ElMessage.warning(message);
};

/**
 * 验证输入是否为有效数字
 * @param {*} value - 要验证的值
 * @returns {boolean} 是否为有效数字
 */
export const isValidNumber = (value) => {
  return !isNaN(parseFloat(value)) && isFinite(value);
};

/**
 * 验证输入是否为正整数
 * @param {*} value - 要验证的值
 * @returns {boolean} 是否为正整数
 */
export const isPositiveInteger = (value) => {
  return Number.isInteger(value) && value > 0;
};

/**
 * 从对象数组中提取指定属性的值，形成新数组
 * @param {Array} array - 对象数组
 * @param {string} key - 要提取的属性名
 * @returns {Array} 提取后的数组
 */
export const pluck = (array, key) => {
  if (!Array.isArray(array)) return [];
  return array.map(item => item[key]);
};

/**
 * 将两个数组按索引合并成对象数组
 * @param {Array} keys - 键名数组
 * @param {Array} values - 值数组
 * @returns {Array} 对象数组
 */
export const zipArrays = (keys, values) => {
  if (!Array.isArray(keys) || !Array.isArray(values)) return [];
  return keys.map((key, index) => ({
    [key]: values[index]
  }));
};

/**
 * 导出Excel表格数据（模拟实现）
 * @param {Array} data - 表格数据
 * @param {string} filename - 文件名
 */
export const exportToExcel = (data, filename = 'data.xlsx') => {
  // 实际项目中，应该使用专门的Excel库如xlsx.js来实现
  // 这里仅做模拟实现
  try {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace('.xlsx', '.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ElMessage.success('数据导出成功');
  } catch (error) {
    ElMessage.error('数据导出失败：' + error.message);
  }
};

/**
 * 获取指定范围内的年月列表
 * @param {string} startYearMonth - 开始年月，格式为'YYYY-MM'
 * @param {string} endYearMonth - 结束年月，格式为'YYYY-MM'
 * @returns {Array} 年月列表，每个元素为{value: 'YYYY-MM', label: 'YYYY年MM月'}
 */
export const getYearMonthRange = (startYearMonth, endYearMonth) => {
  const result = [];
  const [startYear, startMonth] = startYearMonth.split('-').map(Number);
  const [endYear, endMonth] = endYearMonth.split('-').map(Number);
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
    const value = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    const label = `${currentYear}年${currentMonth}月`;
    result.push({ value, label });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  return result;
};

// 导出所有工具函数
export default {
  formatDateTime,
  formatYearMonth,
  formatNumber,
  formatLargeNumber,
  formatPercent,
  deepClone,
  generateId,
  debounce,
  throttle,
  isEmpty,
  random,
  average,
  sum,
  max,
  min,
  handleError,
  showSuccess,
  showWarning,
  isValidNumber,
  isPositiveInteger,
  pluck,
  zipArrays,
  exportToExcel,
  getYearMonthRange
};