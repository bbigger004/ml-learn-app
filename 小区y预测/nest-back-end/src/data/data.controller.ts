import { Controller, Post, Get, UseInterceptors, UploadedFile, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataService } from './data.service';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { PreprocessDataDto } from './dto/preprocess-data.dto';
import { FeatureSelectionDto } from './dto/feature-selection.dto';
import { DataSplitDto } from './dto/data-split.dto';
import { CorrelationAnalysisDto } from './dto/correlation-analysis.dto';
import { FeatureEngineeringDto } from './dto/feature-engineering.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(csv)$/)) {
          return cb(new Error('Only CSV files are allowed!'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      // 处理上传的CSV文件
      const data = await this.dataService.processCsvFile(file);
      
      // 返回数据预览（限制返回前100条记录）
      const preview = data.slice(0, 100);
      const columns = preview.length > 0 ? Object.keys(preview[0]) : [];
      
      return {
        message: '文件上传成功',
        filename: file.originalname,
        totalRecords: data.length,
        columns: columns,
        preview: preview,
      };
    } catch (error) {
      throw new HttpException(
        { message: '文件上传失败', error: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sample')
  async getSampleData() {
    try {
      const data = await this.dataService.getSampleData();
      
      // 返回数据预览和元数据
      const preview = data.slice(0, 100);
      const columns = preview.length > 0 ? Object.keys(preview[0]) : [];
      
      // 提取数值型和类别型字段
      const numericColumns = [];
      const categoricalColumns = [];
      
      if (preview.length > 0) {
        const firstRow = preview[0];
        columns.forEach(col => {
          const value = firstRow[col];
          if (typeof value === 'number') {
            numericColumns.push(col);
          } else {
            categoricalColumns.push(col);
          }
        });
      }
      
      return {
        message: '示例数据获取成功',
        totalRecords: data.length,
        columns: columns,
        numericColumns: numericColumns,
        categoricalColumns: categoricalColumns,
        preview: preview,
      };
    } catch (error) {
      throw new HttpException(
        { message: '获取示例数据失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('preprocess')
  async preprocessData(@Body() dto: PreprocessDataDto) {
    try {
      const processedData = this.dataService.preprocessData(dto.data, dto.options);
      return {
        message: '数据预处理成功',
        data: processedData,
        count: processedData.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: '数据预处理失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('statistics')
  async calculateStatistics(@Body() body: { data: any[] }) {
    try {
      const statistics = this.dataService.calculateStatistics(body.data);
      return {
        message: '统计计算成功',
        statistics,
      };
    } catch (error) {
      throw new HttpException(
        { message: '统计计算失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('features/select')
  async selectFeatures(@Body() dto: FeatureSelectionDto) {
    try {
      const selectedData = this.dataService.selectFeatures(dto.data, dto.features);
      return {
        message: '特征选择成功',
        data: selectedData,
        count: selectedData.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: '特征选择失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('features/correlation')
  async calculateCorrelation(@Body() dto: CorrelationAnalysisDto) {
    try {
      const correlations = this.dataService.calculateCorrelation(dto.data, dto.targetField);
      return {
        message: '相关性分析成功',
        correlations,
        targetField: dto.targetField,
      };
    } catch (error) {
      throw new HttpException(
        { message: '相关性分析失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('features/importance')
  async analyzeFeatureImportance(@Body() dto: CorrelationAnalysisDto) {
    try {
      const importance = this.dataService.analyzeFeatureImportance(dto.data, dto.targetField);
      return {
        message: '特征重要性分析成功',
        importance,
        targetField: dto.targetField,
      };
    } catch (error) {
      throw new HttpException(
        { message: '特征重要性分析失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('features/lag')
  async createLagFeatures(@Body() dto: FeatureEngineeringDto) {
    try {
      const enhancedData = this.dataService.createLagFeatures(
        dto.data,
        dto.fields,
        dto.lagSteps || [1, 3, 6, 12]
      );
      return {
        message: '滞后特征创建成功',
        data: enhancedData,
        count: enhancedData.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: '滞后特征创建失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('features/rolling')
  async createRollingFeatures(@Body() dto: FeatureEngineeringDto) {
    try {
      const enhancedData = this.dataService.createRollingFeatures(
        dto.data,
        dto.fields,
        dto.windows || [3, 6, 12]
      );
      return {
        message: '滚动统计特征创建成功',
        data: enhancedData,
        count: enhancedData.length,
      };
    } catch (error) {
      throw new HttpException(
        { message: '滚动统计特征创建失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('split')
  async splitData(@Body() dto: DataSplitDto) {
    try {
      const { train, test } = this.dataService.splitData(
        dto.data,
        dto.testRatio || 0.2,
        dto.splitMethod || 'time'
      );
      return {
        message: '数据集拆分成功',
        trainData: train,
        testData: test,
        trainCount: train.length,
        testCount: test.length,
        splitMethod: dto.splitMethod || 'time',
        testRatio: dto.testRatio || 0.2,
      };
    } catch (error) {
      throw new HttpException(
        { message: '数据集拆分失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('outliers/detect')
  async detectOutliers(@Body() body: {
    data: any[];
    fields?: string[];
    strategy?: 'clip' | 'remove' | 'replace';
  }) {
    try {
      const { data, fields, strategy = 'clip' } = body;
      const processedData = this.dataService.handleOutliers(data, fields, strategy);
      return {
        message: '异常值检测和处理成功',
        data: processedData,
        count: processedData.length,
        originalCount: data.length,
        strategy,
      };
    } catch (error) {
      throw new HttpException(
        { message: '异常值处理失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('normalize')
  async normalizeData(@Body() body: {
    data: any[];
    fields?: string[];
    method?: 'minmax' | 'zscore';
  }) {
    try {
      const { data, fields, method = 'minmax' } = body;
      const normalizedData = this.dataService.normalizeFeatures(data, fields, method);
      return {
        message: '数据标准化成功',
        data: normalizedData,
        method,
      };
    } catch (error) {
      throw new HttpException(
        { message: '数据标准化失败', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}