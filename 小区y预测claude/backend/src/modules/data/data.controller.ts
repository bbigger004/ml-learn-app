import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Body,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DataService, DataRow } from './data.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('data')
@Controller('api/data')
export class DataController {
  constructor(private readonly dataService: DataService) {}

  @Post('upload')
  @ApiOperation({ summary: '上传CSV数据文件' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `data-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          callback(null, true);
        } else {
          callback(new Error('只支持CSV文件'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.dataService.processUploadedFile(file);
  }

  @Get('preview')
  @ApiOperation({ summary: '获取数据预览' })
  async getDataPreview() {
    return this.dataService.getDataPreview();
  }

  @Get('columns')
  @ApiOperation({ summary: '获取数据列信息' })
  async getColumns() {
    return this.dataService.getColumns();
  }

  @Post('preprocess')
  @ApiOperation({ summary: '数据预处理' })
  async preprocessData(@Body() body: { selectedFeatures: string[]; targetColumn: string }) {
    return this.dataService.preprocessData(body.selectedFeatures, body.targetColumn);
  }
}