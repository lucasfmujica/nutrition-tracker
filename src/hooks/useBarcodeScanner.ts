/**
 * useBarcodeScanner Hook
 * Manages barcode scanner state using html5-qrcode library
 *
 * Supports EAN-13, UPC-A, and other common barcode formats
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { getProductByBarcode, calculateMacros } from '../services/foodApi';
import type { FoodSearchResult, CalculatedMacros } from '../services/foodApi/types';

export interface UseBarcodeScaannerReturn {
    // Scanner state
    isScanning: boolean;
    isInitializing: boolean;
    error: string | null;

    // Scanned product
    scannedBarcode: string | null;
    product: FoodSearchResult | null;
    isLookingUp: boolean;
    notFound: boolean;

    // Amount controls
    amount: number;
    setAmount: (amount: number) => void;
    unit: 'g' | 'serving';
    setUnit: (unit: 'g' | 'serving') => void;

    // Calculated values
    calculatedMacros: CalculatedMacros | null;

    // Actions
    startScanning: (elementId: string) => Promise<void>;
    stopScanning: () => Promise<void>;
    resetScanner: () => void;
    retryLookup: () => Promise<void>;
}

// Camera configuration
const SCANNER_CONFIG = {
    fps: 10,
    qrbox: { width: 250, height: 100 },
    aspectRatio: 1.0,
    formatsToSupport: [
        0,  // QR_CODE
        1,  // AZTEC
        2,  // CODABAR
        3,  // CODE_39
        4,  // CODE_93
        5,  // CODE_128
        6,  // DATA_MATRIX
        7,  // MAXICODE
        8,  // ITF
        9,  // EAN_13
        10, // EAN_8
        11, // PDF_417
        12, // RSS_14
        13, // RSS_EXPANDED
        14, // UPC_A
        15, // UPC_E
        16, // UPC_EAN_EXTENSION
    ],
};

export const useBarcodeScanner = (): UseBarcodeScaannerReturn => {
    // Scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Scanned product state
    const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
    const [product, setProduct] = useState<FoodSearchResult | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Amount controls
    const [amount, setAmount] = useState(100);
    const [unit, setUnit] = useState<'g' | 'serving'>('g');

    // Scanner instance ref
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const elementIdRef = useRef<string | null>(null);

    // Calculate macros when product or amount changes
    const calculatedMacros = product
        ? calculateMacros(product, amount, unit)
        : null;

    // Lookup product by barcode
    const lookupBarcode = useCallback(async (barcode: string) => {
        setIsLookingUp(true);
        setNotFound(false);
        setError(null);

        try {
            const foundProduct = await getProductByBarcode(barcode);

            if (foundProduct) {
                setProduct(foundProduct);
                // Set default amount based on serving size
                if (foundProduct.servingSizeGrams) {
                    setUnit('serving');
                    setAmount(1);
                } else {
                    setUnit('g');
                    setAmount(100);
                }
            } else {
                setNotFound(true);
            }
        } catch (err) {
            console.error('[useBarcodeScanner] Lookup error:', err);
            setError('Error al buscar el producto. Intentá de nuevo.');
        } finally {
            setIsLookingUp(false);
        }
    }, []);

    // Handle successful scan
    const onScanSuccess = useCallback(async (decodedText: string) => {
        // Avoid duplicate scans
        if (scannedBarcode === decodedText) return;

        console.log('[useBarcodeScanner] Barcode detected:', decodedText);
        setScannedBarcode(decodedText);

        // Stop scanning after successful read
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    await scannerRef.current.stop();
                    setIsScanning(false);
                }
            } catch (e) {
                console.warn('[useBarcodeScanner] Error stopping after scan:', e);
            }
        }

        // Lookup the product
        await lookupBarcode(decodedText);
    }, [scannedBarcode, lookupBarcode]);

    // Start scanning
    const startScanning = useCallback(async (elementId: string) => {
        setError(null);
        setIsInitializing(true);
        elementIdRef.current = elementId;

        try {
            // Create new scanner instance
            const scanner = new Html5Qrcode(elementId);
            scannerRef.current = scanner;

            // Get available cameras
            const cameras = await Html5Qrcode.getCameras();

            if (!cameras || cameras.length === 0) {
                throw new Error('No se encontraron cámaras disponibles');
            }

            // Prefer back camera on mobile
            const backCamera = cameras.find(
                (cam) =>
                    cam.label.toLowerCase().includes('back') ||
                    cam.label.toLowerCase().includes('trasera') ||
                    cam.label.toLowerCase().includes('rear')
            );

            const cameraId = backCamera?.id || cameras[0].id;

            // Start scanning
            await scanner.start(
                cameraId,
                SCANNER_CONFIG,
                onScanSuccess,
                () => {} // Ignore scan failures
            );

            setIsScanning(true);
        } catch (err: any) {
            console.error('[useBarcodeScanner] Start error:', err);

            // Handle permission denied
            if (err.name === 'NotAllowedError' || err.message?.includes('Permission')) {
                setError('Permiso de cámara denegado. Habilitalo en configuración del navegador.');
            } else if (err.message?.includes('No se encontraron')) {
                setError(err.message);
            } else {
                setError('Error al iniciar la cámara. Verificá los permisos.');
            }
        } finally {
            setIsInitializing(false);
        }
    }, [onScanSuccess]);

    // Stop scanning
    const stopScanning = useCallback(async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === Html5QrcodeScannerState.SCANNING) {
                    await scannerRef.current.stop();
                }
                await scannerRef.current.clear();
            } catch (e) {
                console.warn('[useBarcodeScanner] Stop error:', e);
            }
            scannerRef.current = null;
        }
        setIsScanning(false);
    }, []);

    // Reset scanner state
    const resetScanner = useCallback(() => {
        setScannedBarcode(null);
        setProduct(null);
        setNotFound(false);
        setError(null);
        setAmount(100);
        setUnit('g');
    }, []);

    // Retry lookup for the same barcode
    const retryLookup = useCallback(async () => {
        if (scannedBarcode) {
            await lookupBarcode(scannedBarcode);
        }
    }, [scannedBarcode, lookupBarcode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (scannerRef.current) {
                scannerRef.current.stop().catch(() => {});
            }
        };
    }, []);

    return {
        // Scanner state
        isScanning,
        isInitializing,
        error,

        // Scanned product
        scannedBarcode,
        product,
        isLookingUp,
        notFound,

        // Amount controls
        amount,
        setAmount,
        unit,
        setUnit,

        // Calculated values
        calculatedMacros,

        // Actions
        startScanning,
        stopScanning,
        resetScanner,
        retryLookup,
    };
};
