import { Image as ImageIcon, Loader2, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyzeWorkoutImages } from '../../services/ai/workoutService';

interface WorkoutScannerProps {
    onSave: (data: any) => void;
    onCancel: () => void;
}

interface ParsedWorkout {
    date: string;
    type: string;
    name: string;
    duration: number;
    calories: number;
    volume: number;
    notes: string;
    exercises: Array<{
        name: string;
        sets: string;
        reps: string;
        weight: string;
    }>;
}

export const WorkoutScanner: React.FC<WorkoutScannerProps> = ({
    onSave,
    onCancel,
}) => {
    const { t, i18n } = useTranslation();
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [parsedWorkout, setParsedWorkout] = useState<ParsedWorkout | null>(null);
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
            const result = await analyzeWorkoutImages(selectedFiles, i18n.language);
            setParsedWorkout(result as ParsedWorkout);
        } catch (error) {
            console.error('Analysis failed:', error);
            setJsonError(t('workouts.scanner.error'));
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSave = () => {
        if (!parsedWorkout) return;

        // Ensure ID exists for optimistic UI and database consistency
        const workoutToSave = {
            ...parsedWorkout,
            id: `w-ai-${Date.now()}`,
        };

        onSave(workoutToSave);
    };

    // Update workout field
    const updateField = (field: keyof ParsedWorkout, value: any) => {
        if (!parsedWorkout) return;
        setParsedWorkout({ ...parsedWorkout, [field]: value });
    };

    // Update exercise
    const updateExercise = (index: number, field: string, value: string) => {
        if (!parsedWorkout) return;
        const updated = [...parsedWorkout.exercises];
        updated[index] = { ...updated[index], [field]: value };
        setParsedWorkout({ ...parsedWorkout, exercises: updated });
    };

    // Delete exercise
    const deleteExercise = (index: number) => {
        if (!parsedWorkout) return;
        const updated = parsedWorkout.exercises.filter((_, i) => i !== index);
        setParsedWorkout({ ...parsedWorkout, exercises: updated });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-surface rounded-3xl p-6 w-full max-w-lg border border-border shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-text-primary">
                            {t('workouts.scanner.title')}
                        </h2>
                        <p className="text-sm text-text-tertiary">
                            {t('workouts.scanner.subtitle')}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-xl hover:bg-surface-lighter text-text-tertiary hover:text-text-secondary transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                {!parsedWorkout ? (
                    <div className="space-y-6">
                        {/* File Upload Area */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group">
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
                            <p className="font-bold text-text-primary">
                                {t('workouts.scanner.uploadPrompt')}
                            </p>
                            <p className="text-xs text-text-tertiary mt-1">
                                {t('workouts.scanner.uploadSubPrompt')}
                            </p>
                        </div>

                        {/* Selected Files Preview */}
                        {selectedFiles.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                                    {t('workouts.scanner.selected')} (
                                    {selectedFiles.length})
                                </h4>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {selectedFiles.map((file, i) => (
                                        <div
                                            key={i}
                                            className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-border">
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
                                    {t('workouts.scanner.analyzing')}
                                </>
                            ) : (
                                <>
                                    <ImageIcon size={20} />
                                    {t('workouts.scanner.analyze')}
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                        {/* Review Banner */}
                        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4 flex items-start gap-3">
                            <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
                            <div className="text-sm text-amber-800 dark:text-amber-200">
                                <p className="font-bold mb-1">
                                    {t('workouts.scanner.review')}
                                </p>
                                <p>{t('workouts.scanner.reviewPrompt')}</p>
                            </div>
                        </div>

                        {jsonError && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl mb-4 font-medium">
                                {jsonError}
                            </div>
                        )}

                        {/* Structured Workout Editor */}
                        <div className="space-y-4 mb-6">
                            {/* Workout Header */}
                            <div className="bg-background dark:bg-surface-lighter rounded-xl p-4 space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                                        {t('workouts.scanner.workoutName')}
                                    </label>
                                    <input
                                        type="text"
                                        value={parsedWorkout?.name || ''}
                                        onChange={(e) => updateField('name', e.target.value)}
                                        className="w-full px-3 py-2 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                                            {t('workouts.scanner.duration')}
                                        </label>
                                        <input
                                            type="number"
                                            value={parsedWorkout?.duration || 0}
                                            onChange={(e) => updateField('duration', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                                            {t('workouts.scanner.calories')}
                                        </label>
                                        <input
                                            type="number"
                                            value={parsedWorkout?.calories || 0}
                                            onChange={(e) => updateField('calories', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-2 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                                        {t('workouts.scanner.volume')}
                                    </label>
                                    <input
                                        type="number"
                                        value={parsedWorkout?.volume || 0}
                                        onChange={(e) => updateField('volume', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Exercises */}
                            <div>
                                <h4 className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">
                                    {t('workouts.scanner.exercises')} ({parsedWorkout?.exercises.length || 0})
                                </h4>
                                <div className="space-y-2">
                                    {parsedWorkout?.exercises.map((exercise, idx) => (
                                        <div key={idx} className="bg-background dark:bg-surface-lighter rounded-xl p-3 relative">
                                            <button
                                                onClick={() => deleteExercise(idx)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center text-xs hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                                                <X size={12} />
                                            </button>
                                            <div className="space-y-2 pr-8">
                                                <input
                                                    type="text"
                                                    value={exercise.name}
                                                    onChange={(e) => updateExercise(idx, 'name', e.target.value)}
                                                    placeholder={t('workouts.scanner.exerciseName')}
                                                    className="w-full px-2 py-1.5 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-sm font-medium focus:ring-2 focus:ring-blue-500/30 outline-none"
                                                />
                                                <div className="grid grid-cols-3 gap-2">
                                                    <input
                                                        type="text"
                                                        value={exercise.sets}
                                                        onChange={(e) => updateExercise(idx, 'sets', e.target.value)}
                                                        placeholder="Sets"
                                                        className="px-2 py-1.5 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-xs text-center focus:ring-2 focus:ring-blue-500/30 outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={exercise.reps}
                                                        onChange={(e) => updateExercise(idx, 'reps', e.target.value)}
                                                        placeholder="Reps"
                                                        className="px-2 py-1.5 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-xs text-center focus:ring-2 focus:ring-blue-500/30 outline-none"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={exercise.weight}
                                                        onChange={(e) => updateExercise(idx, 'weight', e.target.value)}
                                                        placeholder="Weight"
                                                        className="px-2 py-1.5 bg-surface dark:bg-surface border border-border rounded-lg text-text-primary text-xs text-center focus:ring-2 focus:ring-blue-500/30 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-auto pt-4">
                            <button
                                onClick={() => setParsedWorkout(null)}
                                className="flex-1 bg-surface-lighter hover:bg-surface text-text-secondary font-bold py-3.5 rounded-xl transition-colors">
                                {t('workouts.scanner.back')}
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all active:scale-95">
                                {t('workouts.scanner.save')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
