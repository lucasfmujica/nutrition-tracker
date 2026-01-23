import React from 'react';

interface TutorialSpotlightProps {
    targetRect: DOMRect | null;
}

/**
 * TutorialSpotlight - Spotlight effect for tutorial
 *
 * Creates a semi-transparent overlay with a cutout around the target element.
 * Uses SVG clip-path for smooth rounded corners on the spotlight.
 */
export const TutorialSpotlight: React.FC<TutorialSpotlightProps> = ({
    targetRect,
}) => {
    if (!targetRect) {
        // Full overlay without spotlight (for centered modals)
        return (
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity duration-300"
                style={{ pointerEvents: 'none' }}
            />
        );
    }

    // Spotlight dimensions with padding
    const padding = 8;
    const borderRadius = 16;
    const x = targetRect.left - padding;
    const y = targetRect.top - padding;
    const width = targetRect.width + padding * 2;
    const height = targetRect.height + padding * 2;

    return (
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
            {/* SVG mask for spotlight effect */}
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}>
                <defs>
                    <mask id="spotlight-mask">
                        {/* White = visible, Black = cut out */}
                        <rect x="0" y="0" width="100%" height="100%" fill="white" />
                        <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            rx={borderRadius}
                            ry={borderRadius}
                            fill="black"
                        />
                    </mask>
                </defs>

                {/* Dark overlay with mask */}
                <rect
                    x="0"
                    y="0"
                    width="100%"
                    height="100%"
                    fill="rgba(0, 0, 0, 0.6)"
                    mask="url(#spotlight-mask)"
                />
            </svg>

            {/* Animated border around spotlight */}
            <div
                className="absolute border-2 border-primary/50 rounded-2xl animate-pulse"
                style={{
                    left: x,
                    top: y,
                    width,
                    height,
                    pointerEvents: 'auto',
                    boxShadow: '0 0 0 4px rgba(0, 102, 238, 0.1)',
                }}
            />
        </div>
    );
};
