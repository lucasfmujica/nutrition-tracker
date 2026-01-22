/**
 * CircularProgress - Circular progress indicator component
 * Displays a ring progress with current/target values
 */

interface CircularProgressProps {
    current: number;
    target: number;
    label: string;
    color: string;
    size?: number;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    current,
    target,
    label,
    color,
    size = 80,
}) => {
    const percentage = Math.min((current / target) * 100, 100);
    const isOver = current > target;
    const strokeWidth = size < 60 ? 5 : size < 80 ? 6 : 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    // Better font sizes for readability - scale with size
    const fontSize = size < 60 ? 'text-xs' : size < 80 ? 'text-sm' : 'text-base';
    const subFontSize = size < 60 ? 'text-xs' : size < 80 ? 'text-xs' : 'text-xs';
    const labelSize = size < 60 ? 'text-xs' : size < 80 ? 'text-xs' : 'text-sm';

    return (
        <div className="flex flex-col items-center min-w-0">
            <div
                className="relative flex-shrink-0"
                style={{ width: size, height: size }}>
                <svg
                    className="transform -rotate-90 drop-shadow-lg"
                    width={size}
                    height={size}>
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke="#1f2937"
                        strokeWidth={strokeWidth}
                        fill="none"
                    />
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={isOver ? '#f87171' : color}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="transition-all duration-700 ease-out"
                        style={
                            {
                                filter: `drop-shadow(0 0 ${size / 10}px ${isOver ? '#f87171' : color}40)`,
                            } as React.CSSProperties
                        }
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
                    <span
                        className={`${fontSize} font-bold ${isOver ? 'text-red-400' : 'text-white'}`}>
                        {current}
                    </span>
                    <span className={`${subFontSize} text-gray-400`}>/{target}</span>
                </div>
            </div>
            <span className={`${labelSize} font-medium text-gray-300 mt-1`}>
                {label}
            </span>
        </div>
    );
};
