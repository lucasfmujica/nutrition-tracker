import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { analyzeWorkoutImages } from '../../services/ai/workoutService';

interface WorkoutScannerProps {
    onSave: (data: any) => void;
    onCancel: () => void;
}

export const WorkoutScanner: React.FC<WorkoutScannerProps> = ({
    onSave,
    onCancel,
}) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedResult, setParsedResult] = useState<string | null>(null);
    const [jsonError, setJsonError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles((prev) => [...prev, ...filesArray]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        if (selectedFiles.length === 0) return;

        setIsAnalyzing(true);
        setJsonError(null);

        try {
            const result = await analyzeWorkoutImages(selectedFiles);
            setParsedResult(JSON.stringify(result, null, 2));
        } catch (error) {
            console.error('Analysis failed:', error);
            setJsonError('Error al analizar las imágenes. Intenta nuevamente.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        try {
            if (!parsedResult) return;
            const parsed = JSON.parse(parsedResult);

            // Ensure ID exists for optimistic UI and database consistency
            const workoutToSave = {
                ...parsed,
                id: parsed.id || `w-ai-${Date.now()}`,
            };

            onSave(workoutToSave);
        } catch (e) {
            setJsonError('El JSON no es válido. Por favor corrige el formato.');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-lg border border-gray-100 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Importar desde Gravl
                        </h2>
                        <p className="text-sm text-gray-500">
                            Sube capturas de tu entrenamiento
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {!parsedResult ? (
                    <div className="space-y-6">
                        {/* File Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Upload size={24} />
                            </div>
                            <p className="font-bold text-gray-900">
                                Toca para subir imágenes
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Soporta múltiples capturas
                            </p>
                        </div>

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Seleccionadas ({selectedFiles.length})
                                </h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt="preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => removeFile(i)}
                                                className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-500 transition-colors">
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analyze Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={selectedFiles.length === 0 || isAnalyzing}
                            className="w-full bg-gradient-to-br from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2">
                            {isAnalyzing ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Analizando con Gemini IA...
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={20} />
                                    Analizar Entrenamiento
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 min-h-0">
                        {/* JSON Review */}
                        <div className="bg-amber-50 rounded-xl p-4 mb-4 flex items-start gap-3">
                            <div className="text-amber-600 mt-0.5">⚠️</div>
                            <div className="text-sm text-amber-800">
                                <p className="font-bold mb-1">Revisar Resultados</p>
                                <p>
                                    Verifica que los datos sean correctos antes de
                                    guardar. Puedes editar el JSON directamente si es
                                    necesario.
                                </p>
                            </div>
                        </div>

                        {jsonError && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 font-medium">
                                {jsonError}
                            </div>
                        )}

                        <textarea
                            value={parsedResult}
                            onChange={(e) => setParsedResult(e.target.value)}
                            className="w-full flex-1 bg-slate-900 text-green-400 font-mono text-xs p-4 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[300px]"
                            spellCheck={false}
                        />

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setParsedResult(null)}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3.5 rounded-xl transition-colors">
                                Volver
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95">
                                Confirmar y Guardar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
