import React, { ChangeEvent, useState } from 'react';
import {
    CustomTargets,
    FoodEntry,
    Profile,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../../types/domain';
import { calculateMacros } from '../../utils/macroCalculator';
import { IOSShortcutQR } from '../Settings/iOSShortcutQR';
import { OuraTokenSetup } from '../Settings/OuraTokenSetup';

interface ConfigTabProps {
    // Profile
    profile: Profile;
    customTargets: CustomTargets;
    updateConfig: (profile: Profile, targets: CustomTargets) => void;
    // Data counts for stats
    weightHistory: WeightEntry[];
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    stepsLog: StepsEntry[];
    // Export functions
    exportForClaude: () => void;
    exportForNutritionist: () => void;
    exportBackup: () => void;
    importBackup: (e: ChangeEvent<HTMLInputElement>) => void;
    // User ID for iOS Shortcuts
    userId?: string;
}

/**
 * ConfigTab - Configuration and settings
 * Displays profile settings, avatar selection, targets, and export options
 */
export const ConfigTab: React.FC<ConfigTabProps> = ({
    // Profile
    profile,
    customTargets,
    updateConfig,
    // Data counts for stats
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    // Export functions
    exportForClaude,
    exportForNutritionist,
    exportBackup,
    importBackup,
    // User ID
    userId,
}) => {
    const [isRecalculating, setIsRecalculating] = useState(false);

    const handleAutoRecalculate = async () => {
        setIsRecalculating(true);

        try {
            // Map goal from 'cut'/'maintain'/'bulk' to 'lose'/'maintain'/'gain'
            const goalMap = {
                cut: 'lose',
                maintain: 'maintain',
                bulk: 'gain',
            } as const;

            // Map activityLevel to trainingDaysPerWeek (approximation)
            const activityToDays = {
                sedentary: 1,
                light: 2,
                moderate: 4,
                active: 6,
                very_active: 7,
            } as const;

            const trainingDays =
                profile.trainingDaysPerWeek ??
                activityToDays[profile.activityLevel] ??
                4;

            const macros = calculateMacros({
                weight: profile.currentWeight,
                height: profile.height,
                age: profile.age,
                gender: profile.gender || 'male', // Default to male if not set
                trainingDaysPerWeek: trainingDays,
                primaryGoal: goalMap[profile.goal],
            });

            const newTargets: CustomTargets = {
                ...customTargets,
                calories: macros.calories,
                protein: macros.protein,
                carbs: macros.carbs,
                fat: macros.fat,
            };

            await updateConfig(profile, newTargets);
        } catch (err) {
            console.error('[ConfigTab] Error recalculating macros:', err);
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <div className="w-full max-w-none space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                <p className="text-sm text-gray-500">
                    Ajustes de perfil y objetivos
                </p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
                        {profile.avatar && profile.avatar.length <= 4
                            ? profile.avatar
                            : profile.name?.substring(0, 1) || 'L'}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">
                            {profile.name || 'Usuario'}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                            Plan Premium · Activo
                        </p>
                    </div>
                </div>

                {/* Avatar Selection */}
                <div className="mb-8">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">
                        Avatar
                    </label>
                    <div className="grid grid-cols-8 gap-2">
                        {[
                            '💪',
                            '🏋️',
                            '🏃',
                            '🚴',
                            '⚡',
                            '🔥',
                            '🎯',
                            '🏆',
                            '⭐',
                            '💎',
                            '🦾',
                            '🧠',
                            '❤️',
                            '🌟',
                            '👑',
                            '🎪',
                        ].map((emoji) => (
                            <button
                                key={emoji}
                                onClick={() =>
                                    updateConfig(
                                        { ...profile, avatar: emoji },
                                        customTargets,
                                    )
                                }
                                className={`w-full aspect-square rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110 ${
                                    profile.avatar === emoji
                                        ? 'bg-blue-100 ring-2 ring-blue-500 shadow-lg'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                }`}>
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* URL Avatar Override */}
                <div className="mb-8">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                        O URL de Imagen Personalizada
                    </label>
                    <input
                        type="text"
                        value={
                            profile.avatar && profile.avatar.length > 4
                                ? profile.avatar
                                : ''
                        }
                        onChange={(e) =>
                            updateConfig(
                                { ...profile, avatar: e.target.value },
                                customTargets,
                            )
                        }
                        placeholder="https://..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-2 px-1">
                        Si ingresas una URL, se usará en lugar del emoji.
                    </p>
                </div>

                <h2 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em] flex items-center gap-2">
                    PERFIL Y DATOS
                </h2>
                <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Nombre
                        </label>
                        <input
                            type="text"
                            value={profile.name || ''}
                            onChange={(e) =>
                                updateConfig(
                                    { ...profile, name: e.target.value },
                                    customTargets,
                                )
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            placeholder="Tu nombre"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            {weightHistory && weightHistory.length > 0
                                ? 'Peso Inicial (kg)'
                                : 'Peso Actual (kg)'}
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={profile.currentWeight}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        currentWeight:
                                            parseFloat(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Peso Objetivo (kg)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            value={profile.targetWeight}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        targetWeight:
                                            parseFloat(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Altura (cm)
                        </label>
                        <input
                            type="number"
                            value={profile.height}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        height: parseInt(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Meta de Pasos
                        </label>
                        <input
                            type="number"
                            value={profile.stepGoal || 8000}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        stepGoal: parseInt(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.currentTarget.blur();
                                }
                            }}
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Edad
                        </label>
                        <input
                            type="number"
                            value={profile.age}
                            onChange={(e) =>
                                updateConfig(
                                    {
                                        ...profile,
                                        age: parseInt(e.target.value) || 0,
                                    },
                                    customTargets,
                                )
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-bold text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Auto-Calculate Section */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl p-6 border border-purple-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200/30 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/30 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xs font-black text-purple-600 mb-1 uppercase tracking-[0.2em] flex items-center gap-2">
                                🧮 AUTO-CÁLCULO CIENTÍFICO
                            </h2>
                            <p className="text-xs text-gray-600">
                                Ajusta tus datos y recalcula objetivos automáticamente
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                Género
                            </label>
                            <select
                                value={profile.gender || 'male'}
                                onChange={(e) =>
                                    updateConfig(
                                        {
                                            ...profile,
                                            gender: e.target.value as
                                                | 'male'
                                                | 'female',
                                        },
                                        customTargets,
                                    )
                                }
                                className="w-full bg-white/80 border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all">
                                <option value="male">Masculino</option>
                                <option value="female">Femenino</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                Días Entrenamiento
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="7"
                                value={
                                    profile.trainingDaysPerWeek ??
                                    ({
                                        sedentary: 1,
                                        light: 2,
                                        moderate: 4,
                                        active: 6,
                                        very_active: 7,
                                    }[profile.activityLevel] || 4)
                                }
                                onChange={(e) =>
                                    updateConfig(
                                        {
                                            ...profile,
                                            trainingDaysPerWeek:
                                                parseInt(e.target.value) || 0,
                                        },
                                        customTargets,
                                    )
                                }
                                className="w-full bg-white/80 border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                Objetivo
                            </label>
                            <select
                                value={profile.goal || 'cut'}
                                onChange={(e) =>
                                    updateConfig(
                                        {
                                            ...profile,
                                            goal: e.target.value as
                                                | 'cut'
                                                | 'maintain'
                                                | 'bulk',
                                        },
                                        customTargets,
                                    )
                                }
                                className="w-full bg-white/80 border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all">
                                <option value="cut">Bajar Peso</option>
                                <option value="maintain">Mantener</option>
                                <option value="bulk">Subir Peso</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 px-1">
                                Nivel Actividad
                            </label>
                            <select
                                value={profile.activityLevel || 'moderate'}
                                onChange={(e) =>
                                    updateConfig(
                                        {
                                            ...profile,
                                            activityLevel: e.target.value as
                                                | 'sedentary'
                                                | 'light'
                                                | 'moderate'
                                                | 'active'
                                                | 'very_active',
                                        },
                                        customTargets,
                                    )
                                }
                                className="w-full bg-white/80 border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all">
                                <option value="sedentary">Sedentario</option>
                                <option value="light">Ligero</option>
                                <option value="moderate">Moderado</option>
                                <option value="active">Activo</option>
                                <option value="very_active">Muy Activo</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleAutoRecalculate}
                        disabled={isRecalculating}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        {isRecalculating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Recalculando...
                            </>
                        ) : (
                            <>
                                🎯 Recalcular Objetivos con Fórmula Científica
                            </>
                        )}
                    </button>

                    <div className="mt-4 p-3 bg-white/60 border border-purple-200 rounded-xl">
                        <p className="text-xs text-purple-900 font-medium leading-relaxed">
                            <span className="font-black">✨ Mejoras aplicadas:</span>{' '}
                            Déficit 20% (no 500kcal fijo) · Grasa mínima por kg ·
                            Proteína optimizada · Basado en Mifflin-St Jeor
                        </p>
                    </div>
                </div>
            </div>

            {/* Rest Day Targets */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                    OBJETIVOS (REST DAY)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Calorías
                        </label>
                        <input
                            type="number"
                            value={customTargets.calories}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    calories: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-green-600">
                            Prot (g)
                        </label>
                        <input
                            type="number"
                            value={customTargets.protein}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    protein: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-green-50/30 border border-green-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-green-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-yellow-600">
                            Carbs (g)
                        </label>
                        <input
                            type="number"
                            value={customTargets.carbs}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    carbs: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-yellow-50/30 border border-yellow-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-yellow-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 text-red-600">
                            Grasas (g)
                        </label>
                        <input
                            type="number"
                            value={customTargets.fat}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    fat: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-red-50/30 border border-red-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-red-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Fibra (g)
                        </label>
                        <input
                            type="number"
                            value={customTargets.fiber}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    fiber: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Training Day Bonus */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-12 -mt-12 opacity-50" />
                <h2 className="text-xs font-black text-gray-400 mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
                    TRAINING DAY BONUS
                </h2>
                <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Kcal extra
                        </label>
                        <input
                            type="number"
                            value={customTargets.trainingDayCaloriesBonus}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    trainingDayCaloriesBonus:
                                        parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-amber-500 outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                            Carbs (g)
                        </label>
                        <input
                            type="number"
                            value={customTargets.trainingDayCarbs}
                            onChange={(e) =>
                                updateConfig(profile, {
                                    ...customTargets,
                                    trainingDayCarbs: parseInt(e.target.value) || 0,
                                })
                            }
                            className="w-full bg-amber-50/30 border border-amber-100 rounded-2xl px-4 py-3.5 text-lg font-black text-gray-900 focus:border-amber-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <p className="text-xs text-amber-600 mt-4 font-bold bg-amber-50 inline-block px-3 py-1 rounded-full border border-amber-100">
                    Training Day:{' '}
                    {customTargets.calories +
                        (customTargets.trainingDayCaloriesBonus || 0)}{' '}
                    kcal · {customTargets.trainingDayCarbs}g carbs
                </p>
            </div>

            {/* Oura Ring Integration */}
            <OuraTokenSetup
                hasOuraRing={profile.hasOuraRing ?? false}
                currentToken={profile.ouraPersonalToken}
                onSaveToken={async (token) => {
                    await updateConfig(
                        { ...profile, ouraPersonalToken: token },
                        customTargets,
                    );
                }}
                onToggleOura={async (enabled) => {
                    await updateConfig(
                        { ...profile, hasOuraRing: enabled },
                        customTargets,
                    );
                }}
            />

            {/* iOS Shortcuts QR Code */}
            {userId && (
                <IOSShortcutQR
                    userId={userId}
                    onConfigured={() =>
                        updateConfig(
                            { ...profile, iosShortcutsConfigured: true },
                            customTargets,
                        )
                    }
                />
            )}

            {/* Sync Status */}
            <div className="bg-blue-50/50 border border-blue-100 border-dashed rounded-2xl p-4 flex items-center justify-between">
                <p className="text-xs text-blue-600 font-bold">
                    💾 Sincronización automática activa
                </p>
                <div className="flex gap-1">
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '0ms' }}
                    />
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '150ms' }}
                    />
                    <div
                        className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '300ms' }}
                    />
                </div>
            </div>

            {/* Export Section */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                        📤
                    </span>
                    EXPORTAR
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={exportForClaude}
                        className="bg-cyan-50 hover:bg-cyan-100 text-cyan-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        🤖 Claude
                    </button>
                    <button
                        onClick={exportForNutritionist}
                        className="bg-pink-50 hover:bg-pink-100 text-pink-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        🩺 Nutri
                    </button>
                    <button
                        onClick={exportBackup}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                        📤 Backup
                    </button>
                    <label className="bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                        📥 Importar
                        <input
                            type="file"
                            accept=".json"
                            onChange={importBackup}
                            className="hidden"
                        />
                    </label>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <div className="text-sm font-bold text-gray-900">
                            {weightHistory.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">Peso</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <div className="text-sm font-bold text-gray-900">
                            {foodLog.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            Comidas
                        </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <div className="text-sm font-bold text-gray-900">
                            {workoutLog.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            Entrenos
                        </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-xl">
                        <div className="text-sm font-bold text-gray-900">
                            {stepsLog.length}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                            Pasos
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">
                    ⚠️ Importar reemplaza TODOS los datos
                </p>
            </div>
        </div>
    );
};
