"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const model_service_1 = require("./model.service");
let ModelController = class ModelController {
    constructor(modelService) {
        this.modelService = modelService;
    }
    async trainModel(trainModelDto) {
        return this.modelService.trainModel(trainModelDto);
    }
    async getModelEvaluation(modelId) {
        return this.modelService.getModelEvaluation(modelId);
    }
    async getModelList() {
        return this.modelService.getModelList();
    }
    async retrainModel(modelId, trainModelDto) {
        return this.modelService.retrainModel(modelId, trainModelDto);
    }
};
exports.ModelController = ModelController;
__decorate([
    (0, common_1.Post)('train'),
    (0, swagger_1.ApiOperation)({ summary: '训练预测模型' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                selectedFeatures: {
                    type: 'array',
                    items: { type: 'string' },
                    description: '选择的特征列',
                },
                targetColumn: {
                    type: 'string',
                    description: '目标列',
                },
                testSize: {
                    type: 'number',
                    description: '测试集比例',
                    default: 0.2,
                },
                modelParams: {
                    type: 'object',
                    description: '模型参数',
                    properties: {
                        n_estimators: { type: 'number', default: 100 },
                        max_depth: { type: 'number', default: 6 },
                        learning_rate: { type: 'number', default: 0.1 },
                    },
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "trainModel", null);
__decorate([
    (0, common_1.Get)('evaluation/:modelId'),
    (0, swagger_1.ApiOperation)({ summary: '获取模型评估结果' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getModelEvaluation", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: '获取已训练的模型列表' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "getModelList", null);
__decorate([
    (0, common_1.Post)('retrain/:modelId'),
    (0, swagger_1.ApiOperation)({ summary: '重新训练指定模型' }),
    __param(0, (0, common_1.Param)('modelId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ModelController.prototype, "retrainModel", null);
exports.ModelController = ModelController = __decorate([
    (0, swagger_1.ApiTags)('model'),
    (0, common_1.Controller)('api/model'),
    __metadata("design:paramtypes", [model_service_1.ModelService])
], ModelController);
//# sourceMappingURL=model.controller.js.map