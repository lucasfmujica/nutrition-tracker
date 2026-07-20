/**
 * ProgressBar - Horizontal progress bar component
 * Displays a linear progress with current/target values and label
 */

interface ProgressBarProps {
    current: number;
    target: number;
    label: string;
    unit: string;
    color: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    target,
    label,
    unit,
    color,
}) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    return (
        <div className="mb-2 lg:mb-3">
            <div className="flex justify-between mb-1 lg:mb-1.5">
                <span className="text-xs lg:text-sm font-medium text-text-tertiary">
                    {label}
                </span>
                <span
                    className={`text-xs lg:text-sm font-bold ${isOver ? 'text-danger' : 'text-text-tertiary'}`}>
                    {current}/{target}
                    {unit}
                </span>
            </div>
            <div className="w-full bg-progress-track rounded-full h-2 lg:h-2.5 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isOver ? 'bg-danger' : color}`}
                    style={{
                        width: `${percentage}%`,
                        boxShadow:
                            percentage > 0
                                ? `0 0 10px ${isOver ? '#f87171' : 'currentColor'}50`
                                : 'none',
                    }}
                />
            </div>
        </div>
    );
};
