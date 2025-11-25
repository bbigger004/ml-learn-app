import React, { ChangeEvent } from 'react';
import { Upload, Save, Play, RotateCw, FileUp, Settings } from 'lucide-react';
import { ModelConfig, TrainingStatus } from '../types';

interface SidebarProps {
  modelConfig: ModelConfig;
  setModelConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  columns: string[];
  selectedInputs: string[];
  toggleInputColumn: (col: string) => void;
  status: TrainingStatus;
  onTrain: () => void;
  onSave: () => void;
  onLoad: (files: FileList) => void;
  onFileUpload: (file: File) => void;
  datasetSize: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  modelConfig,
  setModelConfig,
  columns,
  selectedInputs,
  toggleInputColumn,
  status,
  onTrain,
  onSave,
  onLoad,
  onFileUpload,
  datasetSize
}) => {

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileUpload(e.target.files[0]);
    }
  };

  const handleModelLoad = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        onLoad(e.target.files);
    }
  }

  return (
    <div className="w-full md:w-80 bg-white h-full border-r border-gray-200 flex flex-col overflow-y-auto shadow-sm z-10">
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600"/>
            配置中心
        </h1>
        <p className="text-xs text-gray-500 mt-1">管理数据和模型参数</p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Data Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">数据源</h3>
          <div className="space-y-3">
            <div className="relative">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                />
                <label
                    htmlFor="csv-upload"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-md cursor-pointer transition-colors text-sm font-medium"
                >
                    <Upload className="w-4 h-4" />
                    {datasetSize > 0 ? '更改 CSV 数据' : '上传 CSV 数据'}
                </label>
            </div>
            {datasetSize > 0 && (
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    已加载 {datasetSize} 行数据
                </div>
            )}
          </div>
        </section>

        {/* Feature Selection */}
        {columns.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">输入特征 (入参)</h3>
                <span className="text-xs text-gray-500">已选 {selectedInputs.length} 个</span>
            </div>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
              {columns.filter(c => c !== 'y').map((col) => (
                <label key={col} className="flex items-center space-x-2 p-1 hover:bg-gray-100 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedInputs.includes(col)}
                    onChange={() => toggleInputColumn(col)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700 truncate" title={col}>{col}</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Hyperparameters */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">模型超参数</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex justify-between">
                <span>训练轮数 (Epochs)</span>
                <span className="text-blue-600">{modelConfig.epochs}</span>
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={modelConfig.epochs}
              onChange={(e) => setModelConfig({ ...modelConfig, epochs: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex justify-between">
                <span>批次大小 (Batch Size)</span>
                <span className="text-blue-600">{modelConfig.batchSize}</span>
            </label>
            <select 
                value={modelConfig.batchSize}
                onChange={(e) => setModelConfig({ ...modelConfig, batchSize: parseInt(e.target.value) })}
                className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 bg-white"
            >
                <option value="16">16</option>
                <option value="32">32</option>
                <option value="64">64</option>
                <option value="128">128</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600 flex justify-between">
                <span>学习率 (Learning Rate)</span>
                <span className="text-blue-600">{modelConfig.learningRate}</span>
            </label>
            <input
              type="number"
              step="0.001"
              value={modelConfig.learningRate}
              onChange={(e) => setModelConfig({ ...modelConfig, learningRate: parseFloat(e.target.value) })}
              className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
            />
          </div>
        </section>

        {/* Actions */}
        <section className="space-y-3 pt-4 border-t border-gray-200">
            <button
                onClick={onTrain}
                disabled={status === TrainingStatus.TRAINING || datasetSize === 0 || selectedInputs.length === 0}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md text-white font-medium transition-all shadow-sm
                    ${status === TrainingStatus.TRAINING 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95'}`}
            >
                {status === TrainingStatus.TRAINING ? (
                    <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        训练中...
                    </>
                ) : (
                    <>
                        <Play className="w-4 h-4 fill-current" />
                        开始训练
                    </>
                )}
            </button>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onSave}
                    disabled={status !== TrainingStatus.COMPLETED}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    保存模型
                </button>
                <div className="relative">
                    <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        id="model-upload" 
                        onChange={handleModelLoad} 
                    />
                    <label
                        htmlFor="model-upload"
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm cursor-pointer"
                    >
                        <FileUp className="w-4 h-4" />
                        加载模型
                    </label>
                </div>
            </div>
        </section>
      </div>
    </div>
  );
};

export default Sidebar;