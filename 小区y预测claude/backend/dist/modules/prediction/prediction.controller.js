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
exports.PredictionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const prediction_service_1 = require("./prediction.service");
let PredictionController = class PredictionController {
    constructor(predictionService) {
        this.predictionService = predictionService;
    }
    async predict(predictDto) {
        return this.predictionService.predict(predictDto.modelId, predictDto.periods);
    }
    async batchPredict(body) {
        return this.predictionService.batchPredict(body.modelId, body.inputData);
    }
    async calculateConfidenceInterval(body) {
        return this.predictionService.calculateConfidenceInterval(body.modelId, body.periods);
    }
};
exports.PredictionController = PredictionController;
__decorate([
    (0, common_1.Post)('predict'),
    (0, swagger_1.ApiOperation)({ summary: '进行未来预测' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                modelId: {
                    type: 'string',
                    description: '模型ID',
                },
                periods: {
                    type: 'number',
                    description: '预测期数',
                    default: 6,
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictionController.prototype, "predict", null);
__decorate([
    (0, common_1.Post)('batch-predict'),
    (0, swagger_1.ApiOperation)({ summary: '批量预测' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictionController.prototype, "batchPredict", null);
__decorate([
    (0, common_1.Post)('confidence-interval'),
    (0, swagger_1.ApiOperation)({ summary: '计算预测置信区间' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PredictionController.prototype, "calculateConfidenceInterval", null);
exports.PredictionController = PredictionController = __decorate([
    (0, swagger_1.ApiTags)('prediction'),
    (0, common_1.Controller)('api/prediction'),
    __metadata("design:paramtypes", [prediction_service_1.PredictionService])
], PredictionController);
//# sourceMappingURL=prediction.controller.js.map