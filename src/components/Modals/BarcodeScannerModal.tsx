/**
 * BarcodeScannerModal - Scan product barcodes using device camera
 * Looks up nutritional info from OpenFoodFacts database
 */

import {
    AlertCircle,
    Barcode,
    Camera,
    ChevronDown,
    Loader2,
    RefreshCw,
    Search,
    X,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import type { FoodEntry } from '../../types/domain';
import { getArgentinaDateString } from '../../utils/dateUtils';

interface BarcodeScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenFoodSearch?: () => void;
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-viewfinder';

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
    isOpen,
    onClose,
    onOpenFoodSearch,
}) => {
    const { t } = useTranslation();
    const {
        isScanning,
        isInitializing,
        error,
        scannedBarcode,
        product,
        isLookingUp,
        notFound,
        amount,
        setAmount,
        unit,
        setUnit,
        calculatedMacros,
        startScanning,
        stopScanning,
        resetScanner,
        retryLookup,
    } = useBarcodeScanner();

    const { saveFoodEntry, setSaveStatus, selectedFoodDate } = useTracker();
    const hasStartedRef = useRef(false);

    // Meal selection
    const [selectedMeal, setSelectedMeal] = useState<FoodEntry['meal']>('lunch');
    const [isSaving, setIsSaving] = useState(false);

    // Start scanner when modal opens
    useEffect(() => {
        if (isOpen && !hasStartedRef.current) {
            hasStartedRef.current = true;
            // Small delay to ensure DOM is ready
            const timer = setTimeout(() => {
                startScanning(SCANNER_ELEMENT_ID);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen, startScanning]);

    // Cleanup when modal closes
    useEffect(() => {
        if (!isOpen) {
            hasStartedRef.current = false;
            stopScanning();
            resetScanner();
            setSelectedMeal('lunch');
        }
    }, [isOpen, stopScanning, resetScanner]);

    // Handle scanning again
    const handleScanAgain = useCallback(() => {
        resetScanner();
        startScanning(SCANNER_ELEMENT_ID);
    }, [resetScanner, startScanning]);

    // Handle save
    const handleSave = async () => {
        if (!product || !calculatedMacros) return;

        setIsSaving(true);

        try {
            const entry: FoodEntry = {
                id: crypto.randomUUID(),
                date: selectedFoodDate || getArgentinaDateString(),
                time: new Date().toLocaleTimeString('es-AR', {
                    timeZone: 'America/Argentina/Buenos_Aires',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                }),
                meal: selectedMeal,
                name: product.brand
                    ? `${product.name} (${product.brand})`
                    : product.name,
                description: `${amount}${unit === 'g' ? 'g' : ` ${t('modals.foods.serving')}`}${amount > 1 ? 's' : ''} - code: ${scannedBarcode}`,
                calories: calculatedMacros.calories,
                protein: calculatedMacros.protein,
                carbs: calculatedMacros.carbs,
                fat: calculatedMacros.fat,
                fiber: calculatedMacros.fiber,
                source: 'barcode',
                reviewed: true,
                confidence: 0.98,
                sourceId: product.id,
            };

            await saveFoodEntry(entry);
            setSaveStatus(t('modals.foods.added'));
            setTimeout(() => setSaveStatus(''), 2000);

            onClose();
        } catch (err) {
            console.error('[BarcodeScannerModal] Error saving:', err);
            setSaveStatus(t('modals.foods.error'));
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
            onClick={onClose}>
            <div
                className="bg-surface rounded-3xl w-full max-w-md shadow-2xl mb-24"
                onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                        <Barcode size={20} className="text-blue-600" />
                        {t('modals.barcode.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-lighter text-text-tertiary hover:bg-surface-lighter transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Camera Viewfinder */}
                {!product && !notFound && (
                    <div className="p-4">
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                            {/* Scanner container */}
                            <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

                            {/* Scanning overlay */}
                            {isScanning && !scannedBarcode && (
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    {/* Scan line animation */}
                                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

                                    {/* Corner markers */}
                                    <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
                                        <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                                        <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                                        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                                        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
                                    </div>
                                </div>
                            )}

                            {/* Initializing state */}
                            {isInitializing && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                                    <Loader2
                                        size={32}
                                        className="animate-spin mb-2"
                                    />
                                    <p className="text-sm">
                                        {t('modals.barcode.initializing')}
                                    </p>
                                </div>
                            )}

                            {/* Looking up state */}
                            {isLookingUp && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                                    <Loader2
                                        size={32}
                                        className="animate-spin mb-2"
                                    />
                                    <p className="text-sm">
                                        {t('modals.barcode.lookingUp')}
                                    </p>
                                    <p className="text-xs text-text-tertiary mt-1">
                                        {scannedBarcode}
                                    </p>
                                </div>
                            )}

                            {/* Error state */}
                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                                    <AlertCircle
                                        size={40}
                                        className="text-red-400 mb-3"
                                    />
                                    <p className="text-sm">{error}</p>
                                    <button
                                        onClick={handleScanAgain}
                                        className="mt-4 px-4 py-2 bg-surface/20 hover:bg-surface/30 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <RefreshCw size={16} />
                                        {t('modals.barcode.scanAnother')}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        {isScanning && !scannedBarcode && !error && (
                            <p className="text-center text-sm text-text-tertiary mt-3">
                                {t('modals.barcode.instructions')}
                            </p>
                        )}
                    </div>
                )}

                {/* Not Found State */}
                {notFound && (
                    <div className="p-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertCircle size={32} className="text-amber-600" />
                        </div>
                        <h3 className="font-bold text-text-primary mb-2">
                            {t('modals.barcode.notFound')}
                        </h3>
                        <p className="text-sm text-text-tertiary mb-4">
                            {t('modals.barcode.notFoundDesc', {
                                barcode: scannedBarcode,
                            })}
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleScanAgain}
                                className="w-full py-3 rounded-2xl bg-surface-lighter hover:bg-surface-lighter text-text-secondary font-medium flex items-center justify-center gap-2 transition-colors">
                                <Camera size={18} />
                                {t('modals.barcode.scanAnother')}
                            </button>

                            {onOpenFoodSearch && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenFoodSearch();
                                    }}
                                    className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors">
                                    <Search size={18} />
                                    {t('modals.barcode.searchByName')}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Product Found */}
                {product && calculatedMacros && (
                    <div className="p-4 space-y-4">
                        {/* Product Card */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
                            <div className="flex gap-3">
                                {product.imageUrl && (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.name}
                                        className="w-16 h-16 rounded-xl object-cover bg-surface flex-shrink-0"
                                        onError={(e) => {
                                            (
                                                e.target as HTMLImageElement
                                            ).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        {t('modals.barcode.found')}
                                    </span>
                                    <h3 className="font-bold text-text-primary truncate">
                                        {product.name}
                                    </h3>
                                    {product.brand && (
                                        <p className="text-sm text-text-tertiary truncate">
                                            {product.brand}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                                    {t('modals.foods.amount')}
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) =>
                                        setAmount(
                                            Math.max(
                                                0,
                                                parseInt(e.target.value) || 0,
                                            ),
                                        )
                                    }
                                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                                    {t('modals.foods.unit')}
                                </label>
                                <div className="relative">
                                    <select
                                        value={unit}
                                        onChange={(e) =>
                                            setUnit(
                                                e.target.value as 'g' | 'serving',
                                            )
                                        }
                                        className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                                        <option value="g">
                                            {t('modals.foods.grams')}
                                        </option>
                                        <option value="serving">
                                            {t('modals.foods.serving')}{' '}
                                            {product.servingSizeGrams &&
                                                `(${product.servingSizeGrams}g)`}
                                        </option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Meal Selection */}
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-1.5 ml-1">
                                {t('modals.foods.meal')}
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedMeal}
                                    onChange={(e) =>
                                        setSelectedMeal(
                                            e.target.value as FoodEntry['meal'],
                                        )
                                    }
                                    className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-text-primary font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer">
                                    <option value="breakfast">
                                        {t('mealTypes.breakfast')}
                                    </option>
                                    <option value="lunch">
                                        {t('mealTypes.lunch')}
                                    </option>
                                    <option value="snack">
                                        {t('mealTypes.snack')}
                                    </option>
                                    <option value="dinner">
                                        {t('mealTypes.dinner')}
                                    </option>
                                    <option value="other">
                                        {t('mealTypes.other')}
                                    </option>
                                    <option value="Pre-entreno">
                                        {t('mealTypes.preworkout')}
                                    </option>
                                    <option value="Post-entreno">
                                        {t('mealTypes.postworkout')}
                                    </option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Calculated Macros */}
                        <div className="bg-background rounded-2xl p-4">
                            <div className="grid grid-cols-5 gap-2 text-center">
                                <MacroValue
                                    label={t('modals.foods.macros.cal')}
                                    value={calculatedMacros.calories}
                                    highlight
                                />
                                <MacroValue
                                    label={t('modals.foods.macros.protein')}
                                    value={calculatedMacros.protein}
                                    suffix="g"
                                />
                                <MacroValue
                                    label={t('modals.foods.macros.carbs')}
                                    value={calculatedMacros.carbs}
                                    suffix="g"
                                />
                                <MacroValue
                                    label={t('modals.foods.macros.fat')}
                                    value={calculatedMacros.fat}
                                    suffix="g"
                                />
                                <MacroValue
                                    label={t('modals.foods.macros.fiber')}
                                    value={calculatedMacros.fiber}
                                    suffix="g"
                                />
                            </div>
                        </div>

                        {/* Scan Another Button */}
                        <button
                            onClick={handleScanAgain}
                            className="w-full py-3 rounded-2xl bg-surface-lighter hover:bg-surface-lighter text-text-secondary text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                            <Camera size={16} />
                            {t('modals.barcode.scanAnother')}
                        </button>
                    </div>
                )}

                {/* Save Button */}
                {product && (
                    <div className="p-4 border-t border-border">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || amount <= 0}
                            className="w-full bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-300 disabled:to-slate-400 py-4 rounded-2xl text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:shadow-none flex items-center justify-center gap-2">
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    {t('modals.foods.saving')}
                                </>
                            ) : (
                                t('modals.foods.save')
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// Sub-component
const MacroValue: React.FC<{
    label: string;
    value: number;
    suffix?: string;
    highlight?: boolean;
}> = ({ label, value, suffix, highlight }) => (
    <div>
        <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
            {label}
        </p>
        <p
            className={`text-lg font-bold ${highlight ? 'text-orange-600' : 'text-text-primary'}`}>
            {value}
            {suffix && (
                <span className="text-xs font-normal text-text-tertiary">{suffix}</span>
            )}
        </p>
    </div>
);
