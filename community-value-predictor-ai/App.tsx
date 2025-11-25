import React, { useState, useCallback, useMemo } from 'react';
import Papa from 'papaparse';
import { Activity, BarChart3, AlertCircle, CheckCircle2, FileSpreadsheet, Microscope } from 'lucide-react';
import Sidebar from './components/Sidebar';
import { LossChart, PredictionChart } from './components/Charts';
import PredictionSimulator from './components/PredictionSimulator';
import EvaluationTable from './components/EvaluationTable';
import { mlService } from './services/mlService';
import { DataRow, ModelConfig, TrainingMetric, PredictionResult, TrainingStatus, ColumnMetadata } from './types';

function App() {
  // --- State ---
  const [data, setData] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedInputs, setSelectedInputs] = useState<string[]>([]);
  const [columnMetadata, setColumnMetadata] = useState<{ [key: string]: ColumnMetadata }>({});
  
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    epochs: 100,
    batchSize: 32,
    learningRate: 0.01,
    hiddenUnits: 64,
  });

  const [trainingStatus, setTrainingStatus] = useState<TrainingStatus>(TrainingStatus.IDLE);
  const [lossHistory, setLossHistory] = useState<TrainingMetric[]>([]);
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Helpers ---
  
  const analyzeColumns = (rows: DataRow[], cols: string[]) => {
    const meta: { [key: string]: ColumnMetadata } = {};
    
    cols.forEach(col => {
        // Initial guess: is it numeric?
        let isNumeric = true;
        let min = Infinity;
        let max = -Infinity;
        const uniqueSet = new Set<string>();
        
        // Sample up to 500 rows for speed
        const sampleSize = Math.min(rows.length, 500);
        
        for (let i = 0; i < sampleSize; i++) {
            const val = rows[i][col];
            if (val === null || val === undefined || val === '') continue;
            
            const strVal = String(val).trim();
            if (strVal === '') continue;

            const num = parseFloat(strVal);
            if (isNaN(num)) {
                isNumeric = false;
                uniqueSet.add(strVal);
            } else {
                // Even if it parses as number, if we previously found strings, it stays string (mixed -> categorical)
                // But if it is numeric so far:
                if (isNumeric) {
                   min = Math.min(min, num);
                   max = Math.max(max, num);
                } else {
                   uniqueSet.add(strVal);
                }
            }
        }

        if (isNumeric && min !== Infinity) {
            meta[col] = { name: col, type: 'number', min, max };
        } else {
            meta[col] = { name: col, type: 'category', uniqueValues: Array.from(uniqueSet).sort() };
        }
    });
    return meta;
  };

  // --- Handlers ---

  const handleFileUpload = (file: File) => {
    setErrorMsg(null);
    setTrainingStatus(TrainingStatus.IDLE);
    setLossHistory([]);
    setPredictionResults([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(), 
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const rows = results.data as DataRow[];
          const cols = Object.keys(rows[0]);
          
          if (!cols.includes('y')) {
            setErrorMsg("CSV 数据缺少 'y' 列。请确保文件中包含名为 'y' 的目标列。");
            setData([]);
            setColumns([]);
            return;
          }

          const meta = analyzeColumns(rows, cols);
          setColumnMetadata(meta);
          setData(rows);
          setColumns(cols);
          
          // Auto-select numeric columns + categorical columns (excluding 'y')
          const potentialInputs = cols.filter(c => c !== 'y');
          setSelectedInputs(potentialInputs);
        }
      },
      error: (err) => {
        setErrorMsg(`CSV 解析错误: ${err.message}`);
      }
    });
  };

  const toggleInputColumn = (col: string) => {
    setSelectedInputs(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleTrain = useCallback(async () => {
    if (!data.length) return;
    
    setTrainingStatus(TrainingStatus.TRAINING);
    setLossHistory([]);
    setPredictionResults([]);
    setErrorMsg(null);

    try {
        // Pass metadata AND config to ensure types and structure are consistent
        await mlService.prepareData(data, selectedInputs, 'y', columnMetadata, modelConfig);

        await mlService.train(
            modelConfig,
            (epoch, loss) => {
                setLossHistory(prev => [...prev, { epoch, loss }]);
            },
            () => {
                setTrainingStatus(TrainingStatus.COMPLETED);
                generatePredictions();
            }
        );
    } catch (e: any) {
        console.error(e);
        setErrorMsg("训练失败: " + (e.message || JSON.stringify(e)));
        setTrainingStatus(TrainingStatus.IDLE);
    }
  }, [data, selectedInputs, modelConfig, columnMetadata]);

  const generatePredictions = async () => {
    if (!data.length) return;
    
    const results: PredictionResult[] = [];
    // Predict on a larger subset for evaluation (e.g. 200 or 20%)
    const subsetSize = Math.min(data.length, 200);
    const subsetIndices = new Set<number>();
    
    const availableIndices = Array.from({length: data.length}, (_, i) => i);
    // Simple random sampling
    for(let i = 0; i < subsetSize; i++) {
        if(availableIndices.length === 0) break;
        const randIdx = Math.floor(Math.random() * availableIndices.length);
        subsetIndices.add(availableIndices[randIdx]);
        availableIndices.splice(randIdx, 1);
    }

    for (let i of Array.from(subsetIndices)) {
      const row = data[i];
      const inputs: any = {};
      let rowIsValid = true;

      selectedInputs.forEach(col => {
         const val = row[col];
         
         if (val === undefined || val === null || val === '') {
             rowIsValid = false;
             return;
         }
         inputs[col] = val;
      });

      if (!rowIsValid) continue;

      try {
        const predicted = await mlService.predict(inputs, columnMetadata);
        
        const outVal = row['y'];
        const actual = typeof outVal === 'string' ? parseFloat(outVal) : outVal;
        
        if (typeof actual === 'number' && !isNaN(actual)) {
            const diff = Math.abs(actual - predicted);
            const errorPercent = actual !== 0 ? (diff / Math.abs(actual)) * 100 : 0;
            results.push({ 
                id: i + 1,
                actual, 
                predicted, 
                error: diff,
                errorPercent 
            });
        }
      } catch (e: any) {
        console.warn(`Prediction warning for row ${i}:`, e.message || e);
      }
    }
    
    if (results.length === 0) {
        setErrorMsg("无法生成预测结果：所有样本数据无效或模型未能正确初始化。");
    } else {
        setPredictionResults(results.sort((a, b) => (a.id || 0) - (b.id || 0)));
    }
  };

  const handleSaveModel = () => {
    mlService.saveModel();
  };

  const handleLoadModel = async (files: FileList) => {
    try {
        await mlService.loadModel(files);
        setTrainingStatus(TrainingStatus.COMPLETED); 
        // Note: We don't automatically generate predictions after load because 
        // we don't know if the current loaded CSV matches the model structure.
        // User can try using Simulator.
        alert("模型已加载。请确保当前上传的CSV数据与模型训练时的特征列一致，否则预测可能会失败。");
    } catch (e) {
        console.error(e);
        setErrorMsg("加载模型失败");
    }
  };

  // --- Metrics Calculation ---
  const finalLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1].loss.toFixed(4) : '-';
  
  const metrics = useMemo(() => {
      if (predictionResults.length === 0) return { mse: '-', mae: '-' };
      
      const sumSquaredError = predictionResults.reduce((acc, curr) => acc + Math.pow(curr.actual - curr.predicted, 2), 0);
      const sumAbsError = predictionResults.reduce((acc, curr) => acc + Math.abs(curr.actual - curr.predicted), 0);
      
      return {
          mse: (sumSquaredError / predictionResults.length).toFixed(2),
          mae: (sumAbsError / predictionResults.length).toFixed(2)
      };
  }, [predictionResults]);

  return (
    <div className="flex h-screen bg-gray-100 text-gray-800 font-sans overflow-hidden">
      <Sidebar 
        modelConfig={modelConfig}
        setModelConfig={setModelConfig}
        columns={columns}
        selectedInputs={selectedInputs}
        toggleInputColumn={toggleInputColumn}
        status={trainingStatus}
        onTrain={handleTrain}
        onSave={handleSaveModel}
        onLoad={handleLoadModel}
        onFileUpload={handleFileUpload}
        datasetSize={data.length}
      />

      <main className="flex-1 flex flex-col h-full overflow-y-auto">
        
        <header className="bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">AI 预测工作台</h2>
                <p className="text-sm text-gray-500">训练、评估与模拟</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                    <span className={`w-2 h-2 rounded-full ${trainingStatus === TrainingStatus.TRAINING ? 'bg-blue-500 animate-pulse' : trainingStatus === TrainingStatus.COMPLETED ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    状态: {trainingStatus}
                </div>
            </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            {errorMsg && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500" />
                    <p className="text-red-700 font-medium">{errorMsg}</p>
                </div>
            )}

            <section>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    训练指标 (Training Metrics)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">最终 Loss</div>
                        <div className="text-3xl font-bold text-gray-900">{finalLoss}</div>
                        <div className="text-xs text-blue-500 mt-1">越低越好</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">平均绝对误差 (MAE)</div>
                        <div className="text-3xl font-bold text-gray-900">{metrics.mae}</div>
                        <div className="text-xs text-indigo-500 mt-1">预测值平均偏离真实值的大小</div>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <div className="text-sm text-gray-500 mb-1">均方误差 (MSE)</div>
                        <div className="text-3xl font-bold text-gray-900">{metrics.mse}</div>
                        <div className="text-xs text-purple-500 mt-1">对大误差更敏感</div>
                    </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-64">
                     <LossChart data={lossHistory} />
                </div>
            </section>
            
            {(trainingStatus === TrainingStatus.COMPLETED || predictionResults.length > 0) && (
                <>
                    <hr className="border-gray-200" />

                    <section>
                         <PredictionSimulator 
                            selectedInputs={selectedInputs} 
                            metadata={columnMetadata} 
                            isModelReady={trainingStatus === TrainingStatus.COMPLETED}
                        />
                    </section>

                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-[400px]">
                             <div className="p-6 border-b border-gray-50">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Microscope className="w-5 h-5 text-blue-500" />
                                    预测分布 (Scatter Plot)
                                </h3>
                                <p className="text-sm text-gray-500">红点越接近虚线，预测越准确</p>
                            </div>
                            <div className="p-4 flex-1">
                                <PredictionChart data={predictionResults} />
                            </div>
                        </div>

                        <div className="min-h-[400px]">
                            <EvaluationTable results={predictionResults} />
                        </div>
                    </section>
                </>
            )}
        </div>
      </main>
    </div>
  );
}

export default App;