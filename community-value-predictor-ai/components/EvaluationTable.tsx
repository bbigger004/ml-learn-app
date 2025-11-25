import React from 'react';
import { PredictionResult } from '../types';
import { Table2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EvaluationTableProps {
  results: PredictionResult[];
  limit?: number;
}

const EvaluationTable: React.FC<EvaluationTableProps> = ({ results, limit = 50 }) => {
  const displayResults = results.slice(0, limit);
  const remaining = Math.max(0, results.length - limit);

  if (results.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Table2 className="w-5 h-5 text-emerald-500" />
            批量测试对比 (Batch Test Analysis)
          </h3>
          <p className="text-sm text-gray-500">真实值 vs 预测值差异分析 (Top {displayResults.length})</p>
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 border-b border-gray-100">ID</th>
              <th className="px-6 py-3 border-b border-gray-100 text-right">真实值 (Actual)</th>
              <th className="px-6 py-3 border-b border-gray-100 text-right">预测值 (Predicted)</th>
              <th className="px-6 py-3 border-b border-gray-100 text-right">绝对误差 (Diff)</th>
              <th className="px-6 py-3 border-b border-gray-100 text-right">误差率 (%)</th>
              <th className="px-6 py-3 border-b border-gray-100 text-center">状态</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {displayResults.map((row, idx) => {
              const errorRate = row.errorPercent || 0;
              // Color coding based on error rate
              const isGood = errorRate < 10;
              const isBad = errorRate > 30;
              
              return (
                <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-500">#{row.id || idx + 1}</td>
                  <td className="px-6 py-3 text-right font-mono">{row.actual.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3 text-right font-mono font-semibold text-blue-600">{row.predicted.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  <td className="px-6 py-3 text-right font-mono text-gray-500">
                     {Math.abs(row.actual - row.predicted).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    <span className={`${isGood ? 'text-green-600' : isBad ? 'text-red-600' : 'text-yellow-600'}`}>
                      {errorRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {isGood ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                    ) : isBad ? (
                        <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />
                    ) : (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mx-auto" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {remaining > 0 && (
             <div className="p-4 text-center text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
                 还有 {remaining} 条数据未显示
             </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationTable;
