import lightgbm as lgb
import numpy as np
import pandas as pd
import joblib
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
from typing import Dict, List, Tuple, Optional

class LightGBMComplaintPredictor:
    """
    LightGBM投诉风险预测模型类
    实现基于LightGBM的二分类预测功能
    """
    
    def __init__(self):
        """
        初始化模型
        """
        self.model = None
        self.params = None
        self.feature_names = None
    
    def set_params(self, params: Optional[Dict] = None):
        """
        设置模型参数
        
        Args:
            params: LightGBM模型参数，如果为None则使用默认参数
        """
        if params is None:
            # 默认参数配置
            self.params = {
                'objective': 'binary',  # 二分类任务
                'metric': 'binary_logloss',  # 评价指标
                'boosting_type': 'gbdt',  # 梯度提升决策树
                'num_leaves': 31,  # 叶子节点数
                'max_depth': 6,  # 最大深度
                'learning_rate': 0.1,  # 学习率
                'n_estimators': 100,  # 树的数量
                'subsample_for_bin': 200000,  # 构建直方图的样本数量
                'min_split_gain': 0.0,  # 分割的最小增益
                'min_child_weight': 0.001,  # 叶子节点最小权重
                'min_child_samples': 20,  # 叶子节点最小样本数
                'subsample': 1.0,  # 行采样比例
                'subsample_freq': 0,  # 行采样频率
                'colsample_bytree': 1.0,  # 列采样比例
                'reg_alpha': 0.0,  # L1正则化参数
                'reg_lambda': 0.0,  # L2正则化参数
                'random_state': 42,  # 随机种子
                'n_jobs': -1  # 使用所有CPU核心
            }
        else:
            self.params = params
    
    def train(self, X_train: np.ndarray, y_train: np.ndarray, 
              X_valid: Optional[np.ndarray] = None, 
              y_valid: Optional[np.ndarray] = None,
              feature_names: Optional[List[str]] = None):
        """
        训练LightGBM模型
        
        Args:
            X_train: 训练特征数据
            y_train: 训练标签数据
            X_valid: 验证特征数据（可选）
            y_valid: 验证标签数据（可选）
            feature_names: 特征名称列表（可选）
            
        Returns:
            self: 训练好的模型实例
        """
        # 确保参数已设置
        if self.params is None:
            self.set_params()
        
        # 保存特征名称
        if feature_names:
            self.feature_names = feature_names
        else:
            # 如果没有提供特征名称，生成默认名称
            self.feature_names = [f'feature_{i}' for i in range(X_train.shape[1])]
        
        # 创建LightGBM数据集
        lgb_train = lgb.Dataset(X_train, label=y_train, feature_name=self.feature_names)
        
        # 如果有验证集，创建验证数据集
        valid_sets = [lgb_train]
        valid_names = ['train']
        
        if X_valid is not None and y_valid is not None:
            lgb_valid = lgb.Dataset(X_valid, label=y_valid, feature_name=self.feature_names)
            valid_sets.append(lgb_valid)
            valid_names.append('valid')
        
        # 训练模型
        self.model = lgb.train(
            self.params,
            lgb_train,
            valid_sets=valid_sets,
            valid_names=valid_names,
            callbacks=[
                lgb.log_evaluation(period=10),  # 每10轮打印一次日志
                lgb.early_stopping(stopping_rounds=50, verbose=True)  # 早停策略
            ]
        )
        
        return self
    
    def predict(self, X: np.ndarray, threshold: float = 0.5):
        """
        使用模型进行预测
        
        Args:
            X: 待预测的特征数据
            threshold: 分类阈值
            
        Returns:
            tuple: (预测概率, 预测类别)
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先训练模型")
        
        # 预测概率
        y_pred_proba = self.model.predict(X)
        
        # 根据阈值预测类别
        y_pred_class = (y_pred_proba >= threshold).astype(int)
        
        return y_pred_proba, y_pred_class
    
    def evaluate(self, X_test: np.ndarray, y_test: np.ndarray, threshold: float = 0.5):
        """
        评估模型性能
        
        Args:
            X_test: 测试特征数据
            y_test: 测试标签数据
            threshold: 分类阈值
            
        Returns:
            Dict: 包含各种评估指标的字典
        """
        # 获取预测结果
        y_pred_proba, y_pred_class = self.predict(X_test, threshold)
        
        # 计算评估指标
        metrics = {
            'accuracy': accuracy_score(y_test, y_pred_class),
            'precision': precision_score(y_test, y_pred_class),
            'recall': recall_score(y_test, y_pred_class),
            'f1': f1_score(y_test, y_pred_class),
            'roc_auc': roc_auc_score(y_test, y_pred_proba)
        }
        
        # 打印评估指标
        print("模型评估结果:")
        for metric_name, metric_value in metrics.items():
            print(f"{metric_name}: {metric_value:.4f}")
        
        # 打印混淆矩阵
        cm = confusion_matrix(y_test, y_pred_class)
        print("\n混淆矩阵:")
        print(cm)
        
        return metrics
    
    def plot_feature_importance(self, max_num_features: int = 10, figsize: Tuple[int, int] = (10, 6)):
        """
        绘制特征重要性图
        
        Args:
            max_num_features: 显示的最大特征数量
            figsize: 图表大小
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先训练模型")
        
        plt.figure(figsize=figsize)
        lgb.plot_importance(self.model, max_num_features=max_num_features, 
                          importance_type='gain', title='特征重要性 (增益)')
        plt.title('LightGBM 特征重要性', fontsize=15)
        plt.tight_layout()
        plt.show()
    
    def plot_split_value_histogram(self, feature_name: str, bins: int = 20):
        """
        绘制特征分割值直方图
        
        Args:
            feature_name: 特征名称
            bins: 直方图的分箱数
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先训练模型")
        
        # 查找特征索引
        if feature_name in self.feature_names:
            feature_idx = self.feature_names.index(feature_name)
        else:
            raise ValueError(f"特征 '{feature_name}' 不存在")
        
        plt.figure(figsize=(10, 6))
        lgb.plot_split_value_histogram(self.model, feature_idx, bins=bins)
        plt.title(f"特征 '{feature_name}' 的分割值分布", fontsize=15)
        plt.tight_layout()
        plt.show()
    
    def save_model(self, file_path: str):
        """
        保存模型到文件
        
        Args:
            file_path: 保存路径
        """
        if self.model is None:
            raise ValueError("没有可保存的模型")
        
        # 保存模型
        joblib.dump({
            'model': self.model,
            'params': self.params,
            'feature_names': self.feature_names
        }, file_path)
        
        print(f"模型已保存至: {file_path}")
    
    def load_model(self, file_path: str):
        """
        从文件加载模型
        
        Args:
            file_path: 模型文件路径
        """
        # 加载模型
        model_data = joblib.load(file_path)
        
        # 恢复模型参数
        self.model = model_data['model']
        self.params = model_data['params']
        self.feature_names = model_data['feature_names']
        
        print(f"模型已从 {file_path} 加载")
        return self
    
    def get_best_iteration(self):
        """
        获取最佳迭代次数
        
        Returns:
            int: 最佳迭代次数
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先训练模型")
        
        return self.model.best_iteration
    
    def get_booster(self):
        """
        获取底层的booster对象
        
        Returns:
            Booster: LightGBM的Booster对象
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先训练模型")
        
        return self.model