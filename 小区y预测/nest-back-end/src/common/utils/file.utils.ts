import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { existsSync, mkdirSync, rmSync } from 'fs';

/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @returns 唯一文件名
 */
export function generateUniqueFileName(originalName: string): string {
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(6).toString('hex');
  
  return `${basename}_${timestamp}_${randomStr}${extension}`;
}

/**
 * 确保目录存在，如果不存在则创建
 * @param directoryPath 目录路径
 */
export function ensureDirectoryExists(directoryPath: string): void {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true });
  }
}

/**
 * 删除文件
 * @param filePath 文件路径
 */
export function deleteFile(filePath: string): void {
  if (existsSync(filePath)) {
    rmSync(filePath);
  }
}

/**
 * 删除目录及其内容
 * @param directoryPath 目录路径
 */
export function deleteDirectory(directoryPath: string): void {
  if (existsSync(directoryPath)) {
    rmSync(directoryPath, { recursive: true, force: true });
  }
}

/**
 * 列出目录中的文件
 * @param directoryPath 目录路径
 * @param extension 可选的文件扩展名过滤器
 * @returns 文件路径数组
 */
export function listFiles(directoryPath: string, extension?: string): string[] {
  if (!existsSync(directoryPath)) {
    return [];
  }
  
  const files = fs.readdirSync(directoryPath, { withFileTypes: true })
    .filter(dirent => dirent.isFile())
    .map(dirent => path.join(directoryPath, dirent.name));
  
  if (extension) {
    return files.filter(file => file.endsWith(`.${extension}`));
  }
  
  return files;
}

/**
 * 读取JSON文件
 * @param filePath 文件路径
 * @returns JSON对象
 */
export function readJsonFile(filePath: string): any {
  if (!existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * 写入JSON文件
 * @param filePath 文件路径
 * @param data 要写入的数据
 */
export function writeJsonFile(filePath: string, data: any): void {
  ensureDirectoryExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * 生成模型ID
 * @param prefix 可选的前缀
 * @returns 唯一的模型ID
 */
export function generateModelId(prefix: string = 'model'): string {
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${randomStr}`;
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（不包含点号）
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).substring(1).toLowerCase();
}

/**
 * 验证文件类型
 * @param filename 文件名
 * @param allowedExtensions 允许的扩展名数组
 * @returns 是否为允许的文件类型
 */
export function isValidFileType(filename: string, allowedExtensions: string[]): boolean {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension.toLowerCase());
}