
import React, { useState, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Expense } from '../types';
import { PieChart as PieIcon, BarChart3, Filter } from 'lucide-react';

interface ExpenseChartProps {
  expenses: Expense[];
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#64748b'];

type ChartType = 'pie' | 'bar';

export const ExpenseChart: React.FC<ExpenseChartProps> = ({ expenses }) => {
  const [chartType, setChartType] = useState<ChartType>('pie');

  // Aggregate expenses by category based on the props provided (parent filters time)
  const data = useMemo(() => {
    const agg = expenses.reduce((acc: any[], curr) => {
      const existing = acc.find(item => item.name === curr.category);
      if (existing) {
        existing.value += curr.amount;
      } else {
        acc.push({ name: curr.category, value: curr.amount });
      }
      return acc;
    }, []);
    
    // Sort for better visuals (high to low)
    return agg.sort((a, b) => b.value - a.value);
  }, [expenses]);

  if (expenses.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400">
        Nenhum gasto registrado para exibir no gráfico.
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[450px] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="text-lg font-semibold text-slate-800">Análise Visual</h3>
        
        <div className="flex gap-2 items-center w-full sm:w-auto justify-end">
          {/* Chart Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'pie' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfico de Pizza"
            >
              <PieIcon size={18} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded transition-all ${
                chartType === 'bar' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Gráfico de Barra"
            >
              <BarChart3 size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {data.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-400">
             <Filter size={32} className="mb-2 opacity-20" />
             <p className="text-sm">Sem dados para visualizar.</p>
           </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            ) : (
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={80} 
                  tick={{fontSize: 12, fill: '#64748b'}}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}}
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
