/**
 * BarcodeScannerModal - Scan product barcodes using device camera
 * Looks up nutritional info from OpenFoodFacts database
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    X,
    Camera,
    Loader2,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    Barcode,
    Search,
} from 'lucide-react';
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner';
import { useTracker } from '../../context/TrackerContext';
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
    const [selectedMeal, setSelectedMeal] = useState<FoodEntry['meal']>('Almuerzo');
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
            setSelectedMeal('Almuerzo');
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
                description: `${amount}${unit === 'g' ? 'g' : ' porción(es)'} - código: ${scannedBarcode}`,
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
            setSaveStatus('✓ Producto escaneado agregado');
            setTimeout(() => setSaveStatus(''), 2000);

            onClose();
        } catch (err) {
            console.error('[BarcodeScannerModal] Error saving:', err);
            setSaveStatus('❌ Error al guardar');
            setTimeout(() => setSaveStatus(''), 3000);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-start justify-center p-4 pt-8 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-md shadow-2xl mb-24"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Barcode size={20} className="text-blue-600" />
                        Escanear Código
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Camera Viewfinder */}
                {!product && !notFound && (
                    <div className="p-4">
                        <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
                            {/* Scanner container */}
                            <div
                                id={SCANNER_ELEMENT_ID}
                                className="w-full h-full"
                            />

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
                                    <Loader2 size={32} className="animate-spin mb-2" />
                                    <p className="text-sm">Iniciando cámara...</p>
                                </div>
                            )}

                            {/* Looking up state */}
                            {isLookingUp && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white">
                                    <Loader2 size={32} className="animate-spin mb-2" />
                                    <p className="text-sm">Buscando producto...</p>
                                    <p className="text-xs text-slate-400 mt-1">{scannedBarcode}</p>
                                </div>
                            )}

                            {/* Error state */}
                            {error && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                                    <AlertCircle size={40} className="text-red-400 mb-3" />
                                    <p className="text-sm">{error}</p>
                                    <button
                                        onClick={handleScanAgain}
                                        className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-medium flex items-center gap-2"
                                    >
                                        <RefreshCw size={16} />
                                        Reintentar
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Instructions */}
                        {isScanning && !scannedBarcode && !error && (
                            <p className="text-center text-sm text-slate-500 mt-3">
                                Apuntá la cámara al código de barras del producto
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
                        <h3 className="font-bold text-slate-900 mb-2">
                            Producto no encontrado
                        </h3>
                        <p className="text-sm text-slate-500 mb-4">
                            El código <span className="font-mono font-bold">{scannedBarcode}</span> no
                            está en nuestra base de datos.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={handleScanAgain}
                                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera size={18} />
                                Escanear otro código
                            </button>

                            {onOpenFoodSearch && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onOpenFoodSearch();
                                    }}
                                    className="w-full py-3 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Search size={18} />
                                    Buscar por nombre
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
                                        className="w-16 h-16 rounded-xl object-cover bg-white flex-shrink-0"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Encontrado
                                    </span>
                                    <h3 className="font-bold text-slate-900 truncate">
                                        {product.name}
                                    </h3>
                                    {product.brand && (
                                        <p className="text-sm text-slate-500 truncate">
                                            {product.brand}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 text-center font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                    Unidad
                                </label>
                                <div className="relative">
                                    <select
                                        value={unit}
                                        onChange={(e) => setUnit(e.target.value as 'g' | 'serving')}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="g">gramos</option>
                                        <option value="serving">
                                            porción {product.servingSizeGrams && `(${product.servingSizeGrams}g)`}
                                        </option>
                                    </select>
                                    <ChevronDown
                                        size={16}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Meal Selection */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                                Comida
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedMeal}
                                    onChange={(e) => setSelectedMeal(e.target.value as FoodEntry['meal'])}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="Desayuno">Desayuno</option>
                                    <option value="Almuerzo">Almuerzo</option>
                                    <option value="Merienda">Merienda</option>
                                    <option value="Cena">Cena</option>
                                    <option value="Snack">Snack</option>
                                    <option value="Pre-entreno">Pre-entreno</option>
                                    <option value="Post-entreno">Post-entreno</option>
                                </select>
                                <ChevronDown
                                    size={16}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Calculated Macros */}
                        <div className="bg-slate-50 rounded-2xl p-4">
                            <div className="grid grid-cols-5 gap-2 text-center">
                                <MacroValue label="Cal" value={calculatedMacros.calories} highlight />
                                <MacroValue label="Prot" value={calculatedMacros.protein} suffix="g" />
                                <MacroValue label="Carbs" value={calculatedMacros.carbs} suffix="g" />
                                <MacroValue label="Grasa" value={calculatedMacros.fat} suffix="g" />
                                <MacroValue label="Fibra" value={calculatedMacros.fiber} suffix="g" />
                            </div>
                        </div>

                        {/* Scan Another Button */}
                        <button
                            onClick={handleScanAgain}
                            className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                            <Camera size={16} />
                            Escanear otro producto
                        </button>
                    </div>
                )}

                {/* Save Button */}
                {product && (
                    <div className="p-4 border-t border-gray-100">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || amount <= 0}
                            className="w-full bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:from-slate-300 disabled:to-slate-400 py-4 rounded-2xl text-white font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:shadow-none flex items-center justify-center gap-2"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar'
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
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {label}
        </p>
        <p className={`text-lg font-bold ${highlight ? 'text-orange-600' : 'text-slate-900'}`}>
            {value}
            {suffix && <span className="text-xs font-normal text-slate-400">{suffix}</span>}
        </p>
    </div>
);
