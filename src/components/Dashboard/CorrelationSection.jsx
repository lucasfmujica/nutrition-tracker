import React from 'react';
import { ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts';

const ScatterCard = ({ title, subtitle, data, xLabel, yLabel, color }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm min-w-[300px] flex-1">
    <div className="mb-4">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis
            type="number"
            dataKey="x"
            name={xLabel}
            tick={{fontSize: 10}}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yLabel}
            tick={{fontSize: 10}}
            tickLine={false}
            axisLine={false}
          />
          <ZAxis type="number" range={[50]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white/90 backdrop-blur border border-slate-100 p-2 rounded-lg shadow-lg text-xs">
                      <p className="font-bold mb-1">{payload[0].payload.date}</p>
                      <p>{xLabel}: {payload[0].value}</p>
                      <p>{yLabel}: {payload[1].value}</p>
                    </div>
                  );
                }
                return null;
            }}
          />
          <Scatter name={title} data={data} fill={color} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CorrelationSection = ({ analytics }) => {
  const { fuelData, recoveryData, disciplineData } = analytics;

  // Only render if we have enough data points to show a trend
  if (fuelData.length < 3 && recoveryData.length < 3) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-slate-900 px-1">Luken Labs 🔬</h2>

      <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {fuelData.length > 2 && (
            <ScatterCard
                title="Combustible vs Rendimiento"
                subtitle="Carbos Ayer vs Volumen Hoy"
                data={fuelData}
                xLabel="Carbos (g)"
                yLabel="Volumen (min)"
                color="#EF4444" // Red for Fuel/Fire
            />
        )}

        {recoveryData.length > 2 && (
            <ScatterCard
                title="Costo de Recuperación"
                subtitle="Volumen Hoy vs Deep Sleep"
                data={recoveryData}
                xLabel="Volumen (min)"
                yLabel="Deep Sleep (min)"
                color="#8B5CF6" // Purple for Sleep
            />
        )}

        {disciplineData.length > 2 && (
             <ScatterCard
                title="Disciplina de Sueño"
                subtitle="Sleep Score vs Calorías"
                data={disciplineData}
                xLabel="Score"
                yLabel="Calorías"
                color="#10B981" // Green for Health
            />
        )}
      </div>
    </div>
  );
};
