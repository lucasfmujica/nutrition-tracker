import React from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const WeightChartCard = ({ data = [], currentWeight, targetWeight }) => {
  // Format data for chart
  const chartData = data
    .slice(0, 7) // Last 7 entries
    .reverse()
    .map(entry => {
      // Safe date formatting without timezone issues (YYYY-MM-DD -> DD/MM)
      const [year, month, day] = entry.date.split('-');
      return {
        date: `${day}/${month}`,
        weight: entry.weight
      };
    });

  const weeklyChange = data.length >= 2 ? (data[0].weight - data[data.length - 1].weight).toFixed(1) : 0;
  const isLoss = weeklyChange <= 0;

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-gray-900 font-bold text-lg">Peso Corporal</h3>
          <p className="text-xs text-gray-400 font-medium">Últimos 7 registros</p>
        </div>
        <div className="text-right">
          <span className="block text-2xl font-bold text-gray-900">{currentWeight} <span className="text-sm font-normal text-gray-400">kg</span></span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLoss ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {weeklyChange > 0 ? '+' : ''}{weeklyChange} kg
          </span>
        </div>
      </div>

      <div className="h-48 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%" minHeight={192}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0066EE" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#0066EE" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              dy={10}
            />
            <Tooltip
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#0066EE', fontWeight: 'bold' }}
              cursor={{ stroke: '#0066EE', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              name="Peso"
              stroke="#0066EE"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorWeight)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
