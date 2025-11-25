import React, { useState, useEffect } from 'react';
import { ColumnMetadata } from '../types';
import { Calculator, ArrowRight, RefreshCw } from 'lucide-react';
import { mlService } from '../services/mlService';

interface PredictionSimulatorProps {
  selectedInputs: string[];
  metadata: { [key: string]: ColumnMetadata };
  isModelReady: boolean;
}

const PredictionSimulator: React.FC<PredictionSimulatorProps> = ({
  selectedInputs,
  metadata,
  isModelReady,
}) => {
  const [inputValues, setInputValues] = useState<{ [key: string]: string | number }>({});
  const [prediction, setPrediction] = useState<number | null>(null);
  const [predicting, setPredicting] = useState(false);

  // Initialize defaults based on metadata (e.g., min value or first category)
  useEffect(() => {
    const defaults: { [key: string]: string | number } = {};
    selectedInputs.forEach(col => {
      const meta = metadata[col];
      if (meta) {
        if (meta.type === 'number') {
          defaults[col] = meta.min || 0;
        } else if (meta.type === 'category' && meta.uniqueValues && meta.uniqueValues.length > 0) {
          defaults[col] = meta.uniqueValues[0];
        } else {
          defaults[col] = '';
        }
      }
    });
    setInputValues(prev => ({ ...defaults, ...prev }));
    setPrediction(null);
  }, [selectedInputs, metadata]);

  const handleInputChange = (col: string, value: string | number) => {
    setInputValues(prev => ({
      ...prev,
      [col]: value
    }));
    // Reset prediction on change to avoid stale data
    setPrediction(null);
  };

  const handlePredict = async () => {
    setPredicting(true);
    try {
      // Convert types as needed for the service
      const processedInputs: any = {};
      Object.keys(inputValues).forEach(key => {
        const val = inputValues[key];
        const meta = metadata[key];
        if (meta && meta.type === 'number') {
          processedInputs[key] = parseFloat(String(val));
        } else {
          processedInputs[key] = val;
        }
      });

      const result = await mlService.predict(processedInputs);
      setPrediction(result);
    } catch (error) {
      console.error("Prediction failed", error);
      alert("预测失败，请检查输入");
    } finally {
      setPredicting(false);
    }
  };

  if (!isModelReady) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
        <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>请先训练或加载模型以使用模拟器</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-50">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <Calculator className="w-5 h-5 text-purple-500" />
          单点预测模拟 (Manual Verification)
        </h3>
        <p className="text-sm text-gray-500">手动调整特征参数，验证模型预测效果</p>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Inputs Panel */}
        <div className="p-6 flex-1 space-y-5 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
          {selectedInputs.map(col => {
            const meta = metadata[col];
            if (!meta) return null;

            return (
              <div key={col} className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                  {col}
                </label>
                
                {meta.type === 'number' ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={meta.min}
                      max={meta.max}
                      step={(meta.max! - meta.min!) / 100}
                      value={inputValues[col] || 0}
                      onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                    <input
                      type="number"
                      value={inputValues[col] || 0}
                      onChange={(e) => handleInputChange(col, parseFloat(e.target.value))}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 outline-none"
                    />
                  </div>
                ) : (
                  <select
                    value={inputValues[col] || ''}
                    onChange={(e) => handleInputChange(col, e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                  >
                    {meta.uniqueValues?.map(val => (
                      <option key={val} value={val}>{val}</option>
                    ))}
                  </select>
                )}
                {meta.type === 'number' && (
                    <div className="flex justify-between text-xs text-gray-400 px-1">
                        <span>Min: {meta.min}</span>
                        <span>Max: {meta.max}</span>
                    </div>
                )}
              </div>
            );
          })}
          
          <button
            onClick={handlePredict}
            disabled={predicting}
            className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md font-medium shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            {predicting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            {predicting ? "计算中..." : "生成预测结果"}
          </button>
        </div>

        {/* Result Panel */}
        <div className="p-8 md:w-1/3 flex flex-col items-center justify-center bg-white">
           {prediction !== null ? (
             <div className="text-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">模型预测结果 (Predicted y)</p>
                <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600 py-2">
                    {prediction.toFixed(2)}
                </div>
                <p className="text-xs text-gray-400 mt-4">基于当前输入参数计算</p>
             </div>
           ) : (
             <div className="text-center text-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <ArrowRight className="w-6 h-6" />
                </div>
                <p className="text-sm">点击按钮生成预测</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PredictionSimulator;
