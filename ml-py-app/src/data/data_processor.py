import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler

class PowerGridDataProcessor:
    """
    电网投诉风险预测数据处理类
    负责数据的加载、清洗、预处理和特征工程
    """
    
    def __init__(self):
        """
        初始化数据处理器
        """
        self.scaler = MinMaxScaler()  # 用于特征标准化
        self.feature_columns = None  # 存储特征列名
        self.target_column = 'complaint_label'  # 目标列名
    
    def load_data(self, file_path):
        """
        加载数据文件
        
        Args:
            file_path: 数据文件路径
            
        Returns:
            pd.DataFrame: 加载的数据
        """
        try:
            # 根据文件扩展名选择读取方法
            if file_path.endswith('.csv'):
                return pd.read_csv(file_path, encoding='utf-8')
            elif file_path.endswith('.xlsx') or file_path.endswith('.xls'):
                return pd.read_excel(file_path)
            else:
                raise ValueError(f"不支持的文件格式: {file_path}")
        except Exception as e:
            print(f"加载数据失败: {e}")
            return None
    
    def clean_data(self, data):
        """
        数据清洗
        
        Args:
            data: 原始数据
            
        Returns:
            pd.DataFrame: 清洗后的数据
        """
        # 复制数据以避免修改原始数据
        cleaned_data = data.copy()
        
        # 处理缺失值
        cleaned_data = cleaned_data.dropna()
        
        # 移除重复行
        cleaned_data = cleaned_data.drop_duplicates()
        
        return cleaned_data
    
    def preprocess_features(self, data):
        """
        预处理特征数据
        
        Args:
            data: 包含特征的数据
            
        Returns:
            np.ndarray: 预处理后的特征数据
        """
        # 定义特征列
        self.feature_columns = [
            'population_density', 'load_rate', 'historical_faults', 
            'special_group_density', 'equipment_age', 'external_risk',
            'is_holiday', 'economic_level', 'historical_complaints', 'temperature'
        ]
        
        # 提取特征数据
        features = data[self.feature_columns].values
        
        # 标准化特征
        features_scaled = self.scaler.fit_transform(features)
        
        return features_scaled
    
    def split_data(self, features, target, test_size=0.2, random_state=42):
        """
        划分训练集和测试集
        
        Args:
            features: 特征数据
            target: 目标数据
            test_size: 测试集比例
            random_state: 随机种子
            
        Returns:
            tuple: (X_train, X_test, y_train, y_test)
        """
        return train_test_split(
            features, 
            target, 
            test_size=test_size, 
            random_state=random_state
        )
    
    def generate_sample_data(self, n_samples=1000):
        """
        生成样本数据（用于演示和测试）
        
        Args:
            n_samples: 样本数量
            
        Returns:
            pd.DataFrame: 生成的样本数据
        """
        # 设置随机种子以确保结果可重现
        np.random.seed(42)
        
        # 生成基础特征
        population_density = np.random.beta(2, 5, n_samples)  # 人口密度 (0-1)
        load_rate = np.random.beta(3, 3, n_samples)  # 负载率 (0-1)
        historical_faults = np.random.poisson(3, n_samples) / 20  # 历史故障数 (归一化)
        special_group_density = np.random.beta(2, 5, n_samples)  # 特殊群体密度 (0-1)
        equipment_age = np.random.beta(5, 2, n_samples)  # 设备老化程度 (0-1)
        external_risk = np.random.beta(1, 4, n_samples)  # 外部风险 (0-1)
        is_holiday = np.random.binomial(1, 0.2, n_samples)  # 是否节假日 (0-1)
        economic_level = np.random.beta(3, 3, n_samples)  # 经济水平 (0-1)
        historical_complaints = np.random.poisson(2, n_samples) / 15  # 历史投诉数 (归一化)
        temperature = (np.random.normal(25, 10, n_samples) - 10) / 30  # 温度 (归一化到0-1)
        
        # 计算投诉风险分数（基于业务规则）
        risk_score = (
            special_group_density * 0.35 +
            load_rate * 0.25 +
            historical_faults * 0.15 +
            population_density * 0.10 +
            equipment_age * 0.08 +
            external_risk * 0.05 +
            is_holiday * 0.02
        )
        
        # 添加一些随机噪声
        risk_score += np.random.normal(0, 0.05, n_samples)
        
        # 转换为二分类标签（0: 不投诉, 1: 投诉）
        # 使用sigmoid函数使得决策边界更平滑
        def sigmoid(x):
            return 1 / (1 + np.exp(-10 * (x - 0.5)))
        
        complaint_prob = sigmoid(risk_score)
        complaint_label = np.random.binomial(1, complaint_prob)
        
        # 创建DataFrame
        data = pd.DataFrame({
            'population_density': population_density,
            'load_rate': load_rate,
            'historical_faults': historical_faults,
            'special_group_density': special_group_density,
            'equipment_age': equipment_age,
            'external_risk': external_risk,
            'is_holiday': is_holiday,
            'economic_level': economic_level,
            'historical_complaints': historical_complaints,
            'temperature': temperature,
            'risk_score': risk_score,
            'complaint_prob': complaint_prob,
            'complaint_label': complaint_label
        })
        
        return data
    
    def save_processed_data(self, data, file_path):
        """
        保存处理后的数据
        
        Args:
            data: 处理后的数据
            file_path: 保存路径
        """
        try:
            if file_path.endswith('.csv'):
                data.to_csv(file_path, index=False, encoding='utf-8')
            elif file_path.endswith('.xlsx'):
                data.to_excel(file_path, index=False)
            print(f"数据已保存至: {file_path}")
        except Exception as e:
            print(f"保存数据失败: {e}")