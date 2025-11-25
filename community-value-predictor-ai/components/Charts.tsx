import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { TrainingMetric, PredictionResult } from '../types';

interface LossChartProps {
  data: TrainingMetric[];
}

export const LossChart: React.FC<LossChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="epoch" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis 
             axisLine={false} 
             tickLine={false} 
             tick={{ fill: '#6b7280', fontSize: 12 }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            formatter={(value: number) => [value.toFixed(4), 'Loss']}
            labelFormatter={(label) => `Epoch: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="loss" 
            stroke="#2563eb" 
            strokeWidth={2} 
            dot={false} 
            activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={300}
            name="损失值"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PredictionChartProps {
  data: PredictionResult[];
}

export const PredictionChart: React.FC<PredictionChartProps> = ({ data }) => {
  // Calculate domain for nice axes
  const maxVal = Math.max(
    ...data.map(d => d.actual),
    ...data.map(d => d.predicted)
  );
  const minVal = Math.min(
    ...data.map(d => d.actual),
    ...data.map(d => d.predicted)
  );

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="actual" 
            name="真实值" 
            domain={[minVal, maxVal]} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{ value: '真实值 (Actual)', position: 'bottom', offset: 0, fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey="predicted" 
            name="预测值" 
            domain={[minVal, maxVal]} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            label={{ value: '预测值 (Predicted)', angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 12 }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip 
             cursor={{ strokeDasharray: '3 3' }} 
             contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
             formatter={(value: number, name: string) => [value.toFixed(2), name]}
          />
          <Scatter name="预测样本" data={data} fill="#ef4444" shape="circle" />
          {/* Ideal Line */}
          <Line 
            dataKey="line" 
            data={[{ x: minVal, y: minVal }, { x: maxVal, y: maxVal }]} 
            stroke="#9ca3af" 
            strokeDasharray="5 5" 
            dot={false} 
            activeDot={false} 
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};