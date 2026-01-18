import React from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Line,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

/**
 * WeightProjectionChart - "The Runway" Visualization
 *
 * Minimalist dual-line chart for the Predictive Weight Engine:
 * - Solid indigo line: Actual weight (past 14 days)
 * - Dashed teal line: Projected path (today → goal)
 * - Green dashed reference line at goal weight
 *
 * Light Mode aesthetic, mobile-optimized at 150px height
 */
export const WeightProjectionChart = ({
  actualPath,
  projectedPath,
  targetWeight,
  height = 150
}) => {
  // Merge actual and projected data for unified chart
  const chartData = React.useMemo(() => {
    if (!actualPath || actualPath.length === 0) return [];

    // Create a map of all dates
    const dataMap = new Map();

    // Add actual weights
    actualPath.forEach(point => {
      const dayLabel = formatDayLabel(point.date);
      dataMap.set(point.date, {
        date: point.date,
        dayLabel,
        actual: point.actualWeight,
        projected: null
      });
    });

    // Add projected weights (may overlap with actual on "today")
    projectedPath?.forEach(point => {
      const dayLabel = formatDayLabel(point.date);
      const existing = dataMap.get(point.date);
      if (existing) {
        existing.projected = point.projectedWeight;
      } else {
        dataMap.set(point.date, {
          date: point.date,
          dayLabel,
          actual: null,
          projected: point.projectedWeight
        });
      }
    });

    // Convert to sorted array
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [actualPath, projectedPath]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[150px] text-gray-400 text-sm">
        Registra tu peso para ver la proyección
      </div>
    );
  }

  // Calculate Y-axis domain
  const allWeights = chartData.flatMap(d => [d.actual, d.projected].filter(Boolean));
  const minWeight = Math.min(...allWeights, targetWeight) - 1;
  const maxWeight = Math.max(...allWeights, targetWeight) + 1;

  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
        >
          <defs>
            {/* Gradient for actual weight area */}
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            {/* Gradient for projected path */}
            <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f3f4f6"
          />

          <XAxis
            dataKey="dayLabel"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            interval="preserveStartEnd"
            dy={5}
          />

          <YAxis
            domain={[minWeight, maxWeight]}
            hide={true}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Goal reference line */}
          <ReferenceLine
            y={targetWeight}
            stroke="#10b981"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
            strokeWidth={1.5}
          />

          {/* Actual weight area (solid indigo) */}
          <Area
            type="monotone"
            dataKey="actual"
            name="Peso Real"
            stroke="#6366f1"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActual)"
            connectNulls={false}
            dot={{ r: 3, strokeWidth: 0, fill: '#6366f1' }}
            activeDot={{ r: 5, strokeWidth: 0, fill: '#6366f1' }}
          />

          {/* Projected path (dashed teal) */}
          <Line
            type="monotone"
            dataKey="projected"
            name="Proyección"
            stroke="#14b8a6"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: '#14b8a6' }}
            connectNulls={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Custom tooltip for weight chart
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white px-3 py-2 rounded-xl shadow-lg border border-gray-100 text-xs">
      <p className="text-gray-500 font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        entry.value && (
          <div key={index} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.stroke }}
            />
            <span className="font-semibold text-gray-700">
              {entry.value.toFixed(1)} kg
            </span>
          </div>
        )
      ))}
    </div>
  );
};

/**
 * Format date to readable label
 */
const formatDayLabel = (dateStr) => {
  if (!dateStr) return '';

  try {
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const isToday = dateStr === today.toISOString().split('T')[0];

    if (isToday) return 'Hoy';

    return new Intl.DateTimeFormat('es-AR', {
      day: 'numeric',
      month: 'short',
      timeZone: 'America/Argentina/Buenos_Aires'
    }).format(date).replace('.', '');
  } catch {
    return dateStr.slice(5); // Fallback: MM-DD
  }
};
