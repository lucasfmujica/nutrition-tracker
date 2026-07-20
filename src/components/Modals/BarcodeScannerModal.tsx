/**
 * BarcodeScannerModal - Scan product barcodes using device camera
 * Looks up nutritional info from OpenFoodFacts database
 */

import {
    AlertCircle,
    Barcode,
    Camera,
    Loader2,
    RefreshCw,
    Search,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../../context/TrackerContext';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import type { FoodEntry } from '../../types/domain';
import {
    getArgentinaDateString,
    getCurrentTimeString,
} from '../../utils/dateUtils';
import { ModalShell } from '../UI/ModalShell';
import { BarcodeResultCard } from './BarcodeResultCard';

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
                time: getCurrentTimeString(),
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

    return (
        <ModalShell
            open={isOpen}
            onClose={onClose}
            title={t('modals.barcode.title')}
            icon={<Barcode size={20} />}
            footer={
                product ? (
                    <button
                        onClick={handleSave}
                        disabled={isSaving || amount <= 0}
                        className="w-full bg-success hover:opacity-90 disabled:opacity-50 py-4 rounded-card text-white font-bold shadow-float transition-all active:scale-[0.98] disabled:shadow-none flex items-center justify-center gap-2">
                        {isSaving ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                {t('modals.foods.saving')}
                            </>
                        ) : (
                            t('modals.foods.save')
                        )}
                    </button>
                ) : undefined
            }>
            {/* Camera Viewfinder */}
            {!product && !notFound && (
                <div>
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                        {/* Scanner container */}
                        <div id={SCANNER_ELEMENT_ID} className="w-full h-full" />

                        {/* Scanning overlay */}
                        {isScanning && !scannedBarcode && (
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {/* Scan line animation */}
                                <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-accent-blue to-transparent animate-pulse" />

                                {/* Corner markers */}
                                <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
                                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-accent-blue rounded-tl-lg" />
                                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-accent-blue rounded-tr-lg" />
                                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-accent-blue rounded-bl-lg" />
                                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-accent-blue rounded-br-lg" />
                                </div>
                            </div>
                        )}

                        {/* Initializing state */}
                        {isInitializing && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay/80 text-white">
                                <Loader2 size={32} className="animate-spin mb-2" />
                                <p className="text-sm">
                                    {t('modals.barcode.initializing')}
                                </p>
                            </div>
                        )}

                        {/* Looking up state */}
                        {isLookingUp && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay/80 text-white">
                                <Loader2 size={32} className="animate-spin mb-2" />
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
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-overlay/90 text-white p-6 text-center">
                                <AlertCircle size={40} className="text-danger mb-3" />
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
                <div className="py-2 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning-soft flex items-center justify-center">
                        <AlertCircle size={32} className="text-warning" />
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
                            className="w-full py-3 rounded-control bg-surface-lighter hover:bg-surface-lighter text-text-secondary font-medium flex items-center justify-center gap-2 transition-colors">
                            <Camera size={18} />
                            {t('modals.barcode.scanAnother')}
                        </button>

                        {onOpenFoodSearch && (
                            <button
                                onClick={() => {
                                    onClose();
                                    onOpenFoodSearch();
                                }}
                                className="w-full py-3 rounded-control bg-primary-soft hover:bg-primary-soft text-primary font-medium flex items-center justify-center gap-2 transition-colors">
                                <Search size={18} />
                                {t('modals.barcode.searchByName')}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Product Found */}
            {product && calculatedMacros && (
                <BarcodeResultCard
                    product={product}
                    calculatedMacros={calculatedMacros}
                    amount={amount}
                    setAmount={setAmount}
                    unit={unit}
                    setUnit={setUnit}
                    selectedMeal={selectedMeal}
                    setSelectedMeal={setSelectedMeal}
                    onScanAgain={handleScanAgain}
                />
            )}
        </ModalShell>
    );
};
