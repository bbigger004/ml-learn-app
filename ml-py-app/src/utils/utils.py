import os
import json
import logging
from datetime import datetime
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, roc_curve, auc
import numpy as np

def setup_logging(log_dir='logs', log_level=logging.INFO):
    """
    设置日志记录
    
    Args:
        log_dir: 日志文件目录
        log_level: 日志级别
        
    Returns:
        logging.Logger: 日志记录器实例
    """
    # 创建日志目录
    if not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # 生成日志文件名
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_file = os.path.join(log_dir, f'complaint_prediction_{timestamp}.log')
    
    # 配置日志记录器
    logging.basicConfig(
        level=log_level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )
    
    logger = logging.getLogger('complaint_prediction')
    logger.info(f"日志已设置，日志文件: {log_file}")
    
    return logger

def save_json(data, file_path):
    """
    保存数据为JSON格式
    
    Args:
        data: 要保存的数据
        file_path: 保存路径
    """
    # 确保目录存在
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # 保存数据
    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"数据已保存至: {file_path}")

def load_json(file_path):
    """
    从JSON文件加载数据
    
    Args:
        file_path: 文件路径
        
    Returns:
        加载的数据
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def plot_confusion_matrix(y_true, y_pred, class_names=['无投诉', '投诉'], figsize=(8, 6)):
    """
    绘制混淆矩阵
    
    Args:
        y_true: 真实标签
        y_pred: 预测标签
        class_names: 类别名称
        figsize: 图表大小
    """
    # 计算混淆矩阵
    cm = confusion_matrix(y_true, y_pred)
    
    # 绘制热图
    plt.figure(figsize=figsize)
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=class_names, yticklabels=class_names)
    plt.xlabel('预测类别')
    plt.ylabel('真实类别')
    plt.title('混淆矩阵')
    plt.tight_layout()
    plt.show()

def plot_roc_curve(y_true, y_score, figsize=(8, 6)):
    """
    绘制ROC曲线
    
    Args:
        y_true: 真实标签
        y_score: 预测概率
        figsize: 图表大小
    """
    # 计算ROC曲线数据
    fpr, tpr, _ = roc_curve(y_true, y_score)
    roc_auc = auc(fpr, tpr)
    
    # 绘制ROC曲线
    plt.figure(figsize=figsize)
    plt.plot(fpr, tpr, color='blue', lw=2, label=f'ROC曲线 (面积 = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], color='red', lw=2, linestyle='--')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('假阳性率')
    plt.ylabel('真阳性率')
    plt.title('受试者工作特征 (ROC) 曲线')
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.show()

def plot_prediction_distribution(y_true, y_score, figsize=(10, 6)):
    """
    绘制预测概率分布
    
    Args:
        y_true: 真实标签
        y_score: 预测概率
        figsize: 图表大小
    """
    plt.figure(figsize=figsize)
    
    # 绘制两类的概率分布
    sns.histplot(y_score[y_true == 0], bins=30, alpha=0.5, label='无投诉', kde=True)
    sns.histplot(y_score[y_true == 1], bins=30, alpha=0.5, label='投诉', kde=True)
    
    plt.xlabel('预测概率')
    plt.ylabel('频率')
    plt.title('预测概率分布')
    plt.legend()
    plt.tight_layout()
    plt.show()

def save_figures(figures_dir='figures'):
    """
    保存当前所有打开的图表
    
    Args:
        figures_dir: 保存目录
    """
    # 创建保存目录
    os.makedirs(figures_dir, exist_ok=True)
    
    # 保存所有图表
    for i in range(plt.gcf().number):
        plt.figure(i + 1)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        file_path = os.path.join(figures_dir, f'figure_{i+1}_{timestamp}.png')
        plt.savefig(file_path, dpi=300, bbox_inches='tight')
        print(f"图表已保存至: {file_path}")

def create_directory_structure(base_dir):
    """
    创建项目目录结构
    
    Args:
        base_dir: 基础目录
    """
    # 定义目录结构
    directories = [
        'data/raw',
        'data/processed',
        'models',
        'notebooks',
        'src/data',
        'src/models',
        'src/utils',
        'src/visualizations',
        'tests',
        'config',
        'logs',
        'figures'
    ]
    
    # 创建目录
    for directory in directories:
        dir_path = os.path.join(base_dir, directory)
        os.makedirs(dir_path, exist_ok=True)
        print(f"创建目录: {dir_path}")

def calculate_risk_level(probability):
    """
    根据预测概率计算风险等级
    
    Args:
        probability: 预测概率
        
    Returns:
        tuple: (风险等级, 风险类别)
    """
    if probability < 0.3:
        return '低风险', 'risk-low'
    elif probability < 0.7:
        return '中风险', 'risk-medium'
    else:
        return '高风险', 'risk-high'

def format_percentage(value, decimals=1):
    """
    将小数格式化为百分比
    
    Args:
        value: 小数值
        decimals: 小数位数
        
    Returns:
        str: 格式化的百分比字符串
    """
    return f"{value:.{decimals}%}"

def create_sample_config(config_path='config/config.json'):
    """
    创建示例配置文件
    
    Args:
        config_path: 配置文件路径
    """
    config = {
        'data': {
            'sample_size': 1000,
            'test_size': 0.2,
            'random_state': 42
        },
        'model': {
            'type': 'lgbm',
            'params': {
                'objective': 'binary',
                'metric': 'binary_logloss',
                'num_leaves': 31,
                'max_depth': 6,
                'learning_rate': 0.1,
                'n_estimators': 100
            }
        },
        'evaluation': {
            'threshold': 0.5,
            'metrics': ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
        }
    }
    
    # 保存配置
    save_json(config, config_path)
    return config