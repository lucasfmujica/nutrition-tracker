import { CONVERSION_CONSTANTS, UnitSystem } from '../types/domain';

/**
 * Converts Kilograms to Pounds
 * @param kg Weight in kilograms
 * @returns Weight in pounds
 */
export const kgToLbs = (kg: number): number => {
    return kg * CONVERSION_CONSTANTS.KG_TO_LBS;
};

/**
 * Converts Pounds to Kilograms
 * @param lbs Weight in pounds
 * @returns Weight in kilograms
 */
export const lbsToKg = (lbs: number): number => {
    return lbs * CONVERSION_CONSTANTS.LBS_TO_KG;
};

/**
 * Converts a weight value based on the target unit system.
 * If unit system is imperial, converts kg -> lbs.
 * If metric, returns kg as is.
 * @param weightKg Weight in kilograms
 * @param unitSystem Target unit system
 * @returns Weight in the target unit
 */
export const convertWeightForDisplay = (
    weightKg: number,
    unitSystem: UnitSystem,
): number => {
    if (unitSystem === 'imperial') {
        return kgToLbs(weightKg);
    }
    return weightKg;
};

/**
 * Formats a weight value for display with unit label.
 * @param weightKg Weight in kilograms
 * @param unitSystem Target unit system
 * @returns Formatted string (e.g. "75.5 kg" or "166.4 lbs")
 */
export const formatWeight = (weightKg: number, unitSystem: UnitSystem): string => {
    const value = convertWeightForDisplay(weightKg, unitSystem);
    const unit = getWeightUnit(unitSystem);

    // Round to 1 decimal place for cleaner display
    return `${value.toFixed(1)} ${unit}`;
};

/**
 * Parses a user input (string or number) into Kilograms.
 * If the current system is imperial, interprets input as lbs and converts to kg.
 * If metric, interprets input as kg.
 * @param value Input value
 * @param unitSystem Current unit system context
 * @returns Weight in Kilograms
 */
export const parseWeightToKg = (
    value: string | number,
    unitSystem: UnitSystem,
): number => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(numValue)) return 0;

    if (unitSystem === 'imperial') {
        return lbsToKg(numValue);
    }

    return numValue;
};

/**
 * Returns the weight unit label for the given system
 * @param unitSystem
 * @returns 'kg' or 'lbs'
 */
export const getWeightUnit = (unitSystem: UnitSystem): string => {
    return unitSystem === 'imperial' ? 'lbs' : 'kg';
};

/**
 * Returns the appropriate step attribute for number inputs
 * @param unitSystem
 * @returns '0.1' or '0.2' (lbs usually needs slightly coarser or similar step)
 */
export const getWeightInputStep = (unitSystem: UnitSystem): string => {
    return '0.1';
};
