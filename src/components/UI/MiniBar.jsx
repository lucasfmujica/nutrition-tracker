/**
 * MiniBar - Minimal progress bar component
 * A compact progress indicator without labels
 */
export const MiniBar = ({ current, target, color }) => {
  const percentage = Math.min((current / target) * 100, 100);
  return (
    <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
    </div>
  );
};
