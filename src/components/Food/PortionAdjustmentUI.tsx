import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Minus, Plus } from 'lucide-react';

interface MacroSummary {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

interface PortionAdjustmentUIProps {
    baseMacros: MacroSummary;
    onConfirm: (multiplier: number, adjustedMacros: MacroSummary) => void;
    onCancel?: () => void;
}

const PRESET_MULTIPLIERS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const MIN_MULTIPLIER = 0.25;
const MAX_MULTIPLIER = 3.0;
const SLIDER_STEP = 0.05;

/**
 * PortionAdjustmentUI - Adjust portion sizes for scanned food
 *
 * Features:
 * - Preset multiplier buttons (×0.5, ×0.75, ×1.0, ×1.25, ×1.5, ×2.0)
 * - Continuous slider (0.25x to 3.0x)
 * - Real-time macro preview
 * - Touch-friendly mobile design
 *
 * Mobile-First:
 * - Min 44x44px touch targets for all buttons
 * - Clear visual feedback
 * - Large text for readability
 */
export const PortionAdjustmentUI: React.FC<PortionAdjustmentUIProps> = ({
    baseMacros,
    onConfirm,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [multiplier, setMultiplier] = useState(1.0);

    // Calculate adjusted macros
    const adjustedMacros = {
        calories: Math.round(baseMacros.calories * multiplier),
        protein: Math.round(baseMacros.protein * multiplier),
        carbs: Math.round(baseMacros.carbs * multiplier),
        fat: Math.round(baseMacros.fat * multiplier),
        fiber: Math.round(baseMacros.fiber * multiplier),
    };

    const handlePresetClick = (preset: number) => {
        setMultiplier(preset);
    };

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMultiplier(parseFloat(e.target.value));
    };

    const handleIncrement = () => {
        setMultiplier((prev) => Math.min(MAX_MULTIPLIER, prev + 0.25));
    };

    const handleDecrement = () => {
        setMultiplier((prev) => Math.max(MIN_MULTIPLIER, prev - 0.25));
    };

    const handleConfirm = () => {
        onConfirm(multiplier, adjustedMacros);
    };

    return (
        <div className="space-y-6 p-6 bg-background rounded-2xl border border-border">
            {/* Header */}
            <div>
                <h3 className="text-xl font-black text-text-primary mb-1">
                    {t('food.portionAdjust.title')}
                </h3>
                <p className="text-sm text-text-tertiary font-medium">
                    {t('food.portionAdjust.subtitle')}
                </p>
            </div>

            {/* Current Multiplier Display */}
            <div className="text-center py-4 px-6 rounded-2xl bg-accent/5 border-2 border-accent/20">
                <p className="text-sm text-text-tertiary font-bold uppercase tracking-wider mb-1">
                    {t('food.portionAdjust.currentPortion')}
                </p>
                <p className="text-5xl font-black text-accent">
                    ×{multiplier.toFixed(2)}
                </p>
            </div>

            {/* Preset Buttons */}
            <div>
                <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-3">
                    {t('food.portionAdjust.quickSizes')}
                </p>
                <div className="grid grid-cols-3 gap-2">
                    {PRESET_MULTIPLIERS.map((preset) => (
                        <button
                            key={preset}
                            onClick={() => handlePresetClick(preset)}
                            className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                                multiplier === preset
                                    ? 'bg-accent text-white shadow-lg scale-105'
                                    : 'bg-background-secondary text-text-secondary hover:bg-accent/10 hover:text-accent'
                            }`}
                        >
                            ×{preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Fine-Tune Slider */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black text-text-tertiary uppercase tracking-wider">
                        {t('food.portionAdjust.fineTune')}
                    </p>
                    <p className="text-xs text-text-tertiary font-medium">
                        {MIN_MULTIPLIER}x - {MAX_MULTIPLIER}x
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Decrement Button */}
                    <button
                        onClick={handleDecrement}
                        disabled={multiplier <= MIN_MULTIPLIER}
                        className="w-12 h-12 rounded-xl bg-background-secondary hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        aria-label="Decrease portion"
                    >
                        <Minus className="w-5 h-5 text-text-secondary" />
                    </button>

                    {/* Slider */}
                    <input
                        type="range"
                        min={MIN_MULTIPLIER}
                        max={MAX_MULTIPLIER}
                        step={SLIDER_STEP}
                        value={multiplier}
                        onChange={handleSliderChange}
                        className="flex-1 h-3 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right,
                                hsl(var(--accent)) 0%,
                                hsl(var(--accent)) ${((multiplier - MIN_MULTIPLIER) / (MAX_MULTIPLIER - MIN_MULTIPLIER)) * 100}%,
                                hsl(var(--background-secondary)) ${((multiplier - MIN_MULTIPLIER) / (MAX_MULTIPLIER - MIN_MULTIPLIER)) * 100}%,
                                hsl(var(--background-secondary)) 100%)`,
                        }}
                    />

                    {/* Increment Button */}
                    <button
                        onClick={handleIncrement}
                        disabled={multiplier >= MAX_MULTIPLIER}
                        className="w-12 h-12 rounded-xl bg-background-secondary hover:bg-accent/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        aria-label="Increase portion"
                    >
                        <Plus className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>
            </div>

            {/* Macro Preview */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border">
                <p className="text-xs font-black text-text-tertiary uppercase tracking-wider mb-3">
                    {t('food.portionAdjust.macrosPreview')}
                </p>
                <div className="grid grid-cols-4 gap-3">
                    {/* Calories */}
                    <div className="text-center">
                        <p className="text-2xl font-black text-text-primary">
                            {adjustedMacros.calories}
                        </p>
                        <p className="text-xs text-text-tertiary font-semibold mt-1">
                            {t('food.portionAdjust.kcal')}
                        </p>
                    </div>

                    {/* Protein */}
                    <div className="text-center">
                        <p className="text-2xl font-black text-protein">
                            {adjustedMacros.protein}
                        </p>
                        <p className="text-xs text-text-tertiary font-semibold mt-1">
                            {t('food.portionAdjust.protein')}
                        </p>
                    </div>

                    {/* Carbs */}
                    <div className="text-center">
                        <p className="text-2xl font-black text-carbs">
                            {adjustedMacros.carbs}
                        </p>
                        <p className="text-xs text-text-tertiary font-semibold mt-1">
                            {t('food.portionAdjust.carbs')}
                        </p>
                    </div>

                    {/* Fat */}
                    <div className="text-center">
                        <p className="text-2xl font-black text-fat">
                            {adjustedMacros.fat}
                        </p>
                        <p className="text-xs text-text-tertiary font-semibold mt-1">
                            {t('food.portionAdjust.fat')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-4 px-6 rounded-xl bg-background-secondary text-text-secondary font-bold text-sm hover:bg-background/50 transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                )}
                <button
                    onClick={handleConfirm}
                    className="flex-1 py-4 px-6 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    {t('food.portionAdjust.confirmButton')}
                </button>
            </div>

            {/* Style for range input */}
            <style>{`
                input[type='range']::-webkit-slider-thumb {
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: hsl(var(--accent));
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                input[type='range']::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: hsl(var(--accent));
                    cursor: pointer;
                    border: none;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                input[type='range']::-webkit-slider-thumb:hover {
                    box-shadow: 0 4px 12px rgba(0, 102, 238, 0.4);
                    transform: scale(1.1);
                }

                input[type='range']::-moz-range-thumb:hover {
                    box-shadow: 0 4px 12px rgba(0, 102, 238, 0.4);
                    transform: scale(1.1);
                }
            `}</style>
        </div>
    );
};
