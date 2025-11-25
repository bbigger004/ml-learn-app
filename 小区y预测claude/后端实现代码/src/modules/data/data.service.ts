import { Injectable, BadRequestException } from '@nestjs/common';
import { createReadStream } from 'fs';
import * as csv from 'csv-parser';
import { join } from 'path';

export interface DataRow {
  [key: string]: string | number;
}

@Injectable()
export class DataService {
  private currentData: DataRow[] = [];
  private currentFilePath: string = '';

  async processUploadedFile(file: Express.Multer.File) {
    try {
      this.currentFilePath = file.path;
      const data = await this.parseCSVFile(file.path);
      this.currentData = data;

      return {
        success: true,
        message: '文件上传成功',
        data: {
          filename: file.filename,
          rowCount: data.length,
          columns: Object.keys(data[0] || {}),
          preview: data.slice(0, 10),
        },
      };
    } catch (error) {
      throw new BadRequestException(`文件处理失败: ${error.message}`);
    }
  }

  async getDataPreview() {
    if (!this.currentData.length) {
      throw new BadRequestException('请先上传数据文件');
    }

    return {
      success: true,
      data: {
        totalRows: this.currentData.length,
        preview: this.currentData.slice(0, 20),
        columns: Object.keys(this.currentData[0]),
      },
    };
  }

  async getColumns() {
    if (!this.currentData.length) {
      throw new BadRequestException('请先上传数据文件');
    }

    const columns = Object.keys(this.currentData[0]);
    const columnStats = {};

    columns.forEach(column => {
      const values = this.currentData.map(row => row[column]);
      const numericValues = values.filter(val => !isNaN(Number(val)) && val !== '');

      columnStats[column] = {
        type: numericValues.length > 0 ? 'numeric' : 'categorical',
        uniqueCount: new Set(values).size,
        sampleValues: Array.from(new Set(values.slice(0, 5))),
      };
    });

    return {
      success: true,
      data: {
        columns,
        columnStats,
      },
    };
  }

  async preprocessData(selectedFeatures: string[], targetColumn: string) {
    if (!this.currentData.length) {
      throw new BadRequestException('请先上传数据文件');
    }

    // 验证选择的特征和目标列是否存在
    const allColumns = Object.keys(this.currentData[0]);
    const invalidFeatures = selectedFeatures.filter(feature => !allColumns.includes(feature));

    if (invalidFeatures.length > 0) {
      throw new BadRequestException(`无效的特征列: ${invalidFeatures.join(', ')}`);
    }

    if (!allColumns.includes(targetColumn)) {
      throw new BadRequestException(`目标列不存在: ${targetColumn}`);
    }

    // 数据预处理逻辑
    const processedData = this.currentData.map(row => {
      const processedRow: any = {};

      // 处理数值型特征
      selectedFeatures.forEach(feature => {
        const value = row[feature];
        if (value === '' || value === null || value === undefined) {
          // 缺失值处理 - 使用中位数填充
          const featureValues = this.currentData
            .map(r => r[feature])
            .filter(v => v !== '' && v !== null && v !== undefined)
            .map(v => Number(v));

          if (featureValues.length > 0) {
            processedRow[feature] = this.calculateMedian(featureValues);
          } else {
            processedRow[feature] = 0;
          }
        } else {
          processedRow[feature] = Number(value);
        }
      });

      // 处理目标变量
      processedRow[targetColumn] = Number(row[targetColumn]);

      return processedRow;
    });

    return {
      success: true,
      data: {
        processedData: processedData.slice(0, 10), // 返回前10行作为预览
        totalRows: processedData.length,
        features: selectedFeatures,
        target: targetColumn,
      },
    };
  }

  private parseCSVFile(filePath: string): Promise<DataRow[]> {
    return new Promise((resolve, reject) => {
      const results: DataRow[] = [];

      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
          // 转换数值型字段
          const processedRow: DataRow = {};
          Object.keys(data).forEach(key => {
            const value = data[key];
            // 尝试转换为数字，如果失败则保持字符串
            const numValue = Number(value);
            processedRow[key] = isNaN(numValue) ? value : numValue;
          });
          results.push(processedRow);
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  getCurrentData(): DataRow[] {
    return this.currentData;
  }
}