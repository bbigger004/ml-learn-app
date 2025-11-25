"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const csv = require("csv-parser");
let DataService = class DataService {
    constructor() {
        this.currentData = [];
        this.currentFilePath = '';
    }
    async processUploadedFile(file) {
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
        }
        catch (error) {
            throw new common_1.BadRequestException(`文件处理失败: ${error.message}`);
        }
    }
    async getDataPreview() {
        if (!this.currentData.length) {
            throw new common_1.BadRequestException('请先上传数据文件');
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
            throw new common_1.BadRequestException('请先上传数据文件');
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
    async preprocessData(selectedFeatures, targetColumn) {
        if (!this.currentData.length) {
            throw new common_1.BadRequestException('请先上传数据文件');
        }
        const allColumns = Object.keys(this.currentData[0]);
        const invalidFeatures = selectedFeatures.filter(feature => !allColumns.includes(feature));
        if (invalidFeatures.length > 0) {
            throw new common_1.BadRequestException(`无效的特征列: ${invalidFeatures.join(', ')}`);
        }
        if (!allColumns.includes(targetColumn)) {
            throw new common_1.BadRequestException(`目标列不存在: ${targetColumn}`);
        }
        const processedData = this.currentData.map(row => {
            const processedRow = {};
            selectedFeatures.forEach(feature => {
                const value = row[feature];
                if (value === '' || value === null || value === undefined) {
                    const featureValues = this.currentData
                        .map(r => r[feature])
                        .filter(v => v !== '' && v !== null && v !== undefined)
                        .map(v => Number(v));
                    if (featureValues.length > 0) {
                        processedRow[feature] = this.calculateMedian(featureValues);
                    }
                    else {
                        processedRow[feature] = 0;
                    }
                }
                else {
                    if (typeof value === 'string' && isNaN(Number(value))) {
                        let hash = 0;
                        for (let i = 0; i < value.length; i++) {
                            hash = ((hash << 5) - hash) + value.charCodeAt(i);
                            hash = hash & hash;
                        }
                        processedRow[feature] = Math.abs(hash) % 1000;
                    }
                    else {
                        processedRow[feature] = Number(value);
                    }
                }
            });
            processedRow[targetColumn] = Number(row[targetColumn]);
            return processedRow;
        });
        return {
            success: true,
            data: {
                processedData: processedData.slice(0, 10),
                totalRows: processedData.length,
                features: selectedFeatures,
                target: targetColumn,
            },
        };
    }
    parseCSVFile(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            (0, fs_1.createReadStream)(filePath)
                .pipe(csv())
                .on('data', (data) => {
                const processedRow = {};
                Object.keys(data).forEach(key => {
                    const value = data[key];
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
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2;
        }
        else {
            return sorted[middle];
        }
    }
    getCurrentData() {
        return this.currentData;
    }
};
exports.DataService = DataService;
exports.DataService = DataService = __decorate([
    (0, common_1.Injectable)()
], DataService);
//# sourceMappingURL=data.service.js.map