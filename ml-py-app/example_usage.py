#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
投诉风险预测系统使用示例

本脚本演示如何使用LightGBM模型进行投诉风险预测
包括数据生成、模型训练、评估和预测的完整流程
"""

import os
import sys
from src.data.data_processor import PowerGridDataProcessor
from src.models.lgbm_model import LightGBMComplaintPredictor
from src.utils.utils import (
    setup_logging, plot_confusion_matrix, plot_roc_curve,
    calculate_risk_level, format_percentage
)

def main():
    """
    主函数 - 演示投诉风险预测系统的完整流程
    """
    # 设置日志
    logger = setup_logging()
    logger.info("投诉风险预测系统使用示例开始")
    
    # 确保数据目录存在
    os.makedirs('data/raw', exist_ok=True)
    os.makedirs('data/processed', exist_ok=True)
    os.makedirs('models', exist_ok=True)
    
    try:
        # 1. 数据处理
        logger.info("开始数据处理...")
        data_processor = PowerGridDataProcessor()
        
        # 生成样本数据（在实际应用中，这里应该是加载真实数据）
        logger.info("生成样本数据...")
        sample_data = data_processor.generate_sample_data(n_samples=1000)
        
        # 保存样本数据
        raw_data_path = 'data/raw/sample_data.csv'
        sample_data.to_csv(raw_data_path, index=False, encoding='utf-8')
        logger.info(f"样本数据已保存至: {raw_data_path}")
        
        # 数据清洗
        cleaned_data = data_processor.clean_data(sample_data)
        logger.info(f"数据清洗完成，剩余数据量: {len(cleaned_data)}")
        
        # 预处理特征
        X = data_processor.preprocess_features(cleaned_data)
        y = cleaned_data['complaint_label'].values
        
        # 划分训练集和测试集
        X_train, X_test, y_train, y_test = data_processor.split_data(X, y, test_size=0.2)
        logger.info(f"数据分割完成，训练集大小: {len(X_train)}, 测试集大小: {len(X_test)}")
        
        # 2. 模型训练
        logger.info("开始模型训练...")
        model = LightGBMComplaintPredictor()
        
        # 设置模型参数
        model_params = {
            'objective': 'binary',
            'metric': 'binary_logloss',
            'num_leaves': 31,
            'max_depth': 8,
            'learning_rate': 0.05,
            'n_estimators': 200,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'random_state': 42,
            'n_jobs': -1
        }
        model.set_params(model_params)
        
        # 特征名称
        feature_names = [
            '人口密度', '负载率', '历史故障数', 
            '特殊群体密度', '设备老化程度', '外部风险',
            '是否节假日', '经济水平', '历史投诉数', '温度'
        ]
        
        # 训练模型
        model.train(X_train, y_train, X_test, y_test, feature_names)
        logger.info(f"模型训练完成，最佳迭代次数: {model.get_best_iteration()}")
        
        # 保存模型
        model_path = 'models/lgbm_complaint_predictor.joblib'
        model.save_model(model_path)
        logger.info(f"模型已保存至: {model_path}")
        
        # 3. 模型评估
        logger.info("开始模型评估...")
        metrics = model.evaluate(X_test, y_test)
        
        # 绘制评估图表
        logger.info("绘制评估图表...")
        y_pred_proba, y_pred_class = model.predict(X_test)
        
        # 绘制混淆矩阵
        plot_confusion_matrix(y_test, y_pred_class)
        
        # 绘制ROC曲线
        plot_roc_curve(y_test, y_pred_proba)
        
        # 绘制特征重要性
        model.plot_feature_importance()
        
        # 4. 模型预测示例
        logger.info("演示模型预测...")
        
        # 生成一些测试样本
        test_samples = X_test[:5]  # 取前5个测试样本
        
        # 进行预测
        probabilities, classes = model.predict(test_samples)
        
        # 显示预测结果
        print("\n预测结果示例:")
        print("-" * 80)
        for i, (prob, cls) in enumerate(zip(probabilities, classes)):
            risk_level, risk_class = calculate_risk_level(prob)
            print(f"样本 {i+1}:")
            print(f"  预测概率: {format_percentage(prob)}")
            print(f"  预测类别: {'投诉' if cls == 1 else '无投诉'}")
            print(f"  风险等级: {risk_level}")
            print("-" * 80)
        
        logger.info("投诉风险预测系统使用示例完成")
        
    except Exception as e:
        logger.error(f"运行出错: {str(e)}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()