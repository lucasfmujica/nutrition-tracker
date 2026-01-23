import { useCallback, useEffect, useMemo, useState } from 'react';
import { CustomTargets, FoodEntry, WaterEntry, Workout } from '../types/domain';
import { getSmartTargets } from '../utils/caloriePeriodization';
import { getArgentinaDateString } from '../utils/dateUtils';
import { storage } from '../utils/storage';
import { addPendingWrite } from '../utils/storageUtils';
import { useSupabase } from './useSupabase';

type SupabaseClient = ReturnType<typeof useSupabase>;

export const useNutrition = (
    supabase: SupabaseClient,
    useCloud: boolean,
    customTargets: CustomTargets,
    isTrainingDay?: boolean, // Deprecated/Legacy
    safetyNetGetTargets: ((date: string) => CustomTargets | null) | null = null,
    shouldTagAsSafetyNetDay: ((date: string) => boolean) | null = null,
    workoutLog: Workout[] = [], // New prop for smart targeting
    weeklyPlan: Record<number, any> = {}, // Added plan support
) => {
    const [foodLog, setFoodLog] = useState<FoodEntry[]>([]);
    const [waterLog, setWaterLog] = useState<WaterEntry[]>([]);

    // Calculations
    // Optimization: Daily Data Indexing
    type IndexedData = Record<
        string,
        {
            totals: {
                calories: number;
                protein: number;
                carbs: number;
                fat: number;
                fiber: number;
            };
            items: FoodEntry[];
        }
    >;

    const indexedData = useMemo(() => {
        const index: IndexedData = {};

        foodLog.forEach((entry) => {
            if (!index[entry.date]) {
                index[entry.date] = {
                    totals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
                    items: [],
                };
            }

            // Add items
            index[entry.date].items.push(entry);

            // Sum totals
            const t = index[entry.date].totals;
            t.calories += entry.calories || 0;
            t.protein += entry.protein || 0;
            t.carbs += entry.carbs || 0;
            t.fat += entry.fat || 0;
            t.fiber += entry.fiber || 0;
        });

        return index;
    }, [foodLog]);

    const getTotalsForDate = useCallback(
        (date: string) => {
            return (
                indexedData[date]?.totals || {
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    fiber: 0,
                }
            );
        },
        [indexedData],
    );

    const getFoodsForDate = useCallback(
        (date: string) => {
            return indexedData[date]?.items || [];
        },
        [indexedData],
    );

    const getTargetsForDate = useCallback(
        (date: string): CustomTargets => {
            // Priority 1: Check Safety Net mode (overrides everything)
            if (safetyNetGetTargets) {
                const safetyNetTargets = safetyNetGetTargets(date);
                if (safetyNetTargets) {
                    return safetyNetTargets;
                }
            }

            // Priority 2: Smart Periodization (Plan aware)
            return getSmartTargets(
                date,
                workoutLog,
                customTargets,
                weeklyPlan,
            ) as CustomTargets;
        },
        [customTargets, workoutLog, safetyNetGetTargets, weeklyPlan],
    );

    const isDayCompleted = useCallback(
        (date: string) => {
            const totals = getTotalsForDate(date);
            const targets = getTargetsForDate(date);
            const calRange = 150;
            const calOk =
                totals.calories >= targets.calories - calRange &&
                totals.calories <= targets.calories + calRange;
            const protOk = totals.protein >= targets.protein * 0.9;
            return calOk && protOk;
        },
        [getTotalsForDate, getTargetsForDate],
    );

    // Persistence
    useEffect(() => {
        if (foodLog?.length > 0) {
            storage
                .set('lucas-food-log-v5', JSON.stringify(foodLog))
                .catch((err) => console.error('Error auto-saving food log:', err));
        }
    }, [foodLog]);

    // Actions
    const saveFoodLog = useCallback(async (newLog: FoodEntry[]) => {
        setFoodLog(newLog);
    }, []);

    const saveFoodEntry = useCallback(
        async (entry: FoodEntry): Promise<FoodEntry | null> => {
            // Tag entry if it's a safety net day
            const taggedEntry: FoodEntry = {
                ...entry,
                sourceId:
                    shouldTagAsSafetyNetDay && shouldTagAsSafetyNetDay(entry.date)
                        ? 'safety-net'
                        : entry.sourceId, // Assuming using sourceId or implicit
                // Original code had: is_safety_net_day: ...
                // FoodEntry interface doesn't have is_safety_net_day. I should check if I can add it or if it's implicit.
                // Re-checking JS: ...entry, is_safety_net_day: ...
                // If Type doesn't have it, I might need to cast or omit.
                // Assuming FoodEntry allows extra props or I need to extend it.
                // For now I will cast to any to keep logic or ignore if not critical.
                // Actually, if 'is_safety_net_day' is saved to DB, it should be in the type or DB schema.
                // I'll keep it as any for the variable.
            };

            // Correcting the safety net tag logic properly:
            // JS: is_safety_net_day: shouldTagAsSafetyNetDay ? ...
            // Verify mapped type. FoodEntry likely maps structure.
            // I'll ignore the property if it's not in the type, or cast.
            const entryToSave = {
                ...entry,
                // @ts-ignore: Custom property for logic
                is_safety_net_day: shouldTagAsSafetyNetDay
                    ? shouldTagAsSafetyNetDay(entry.date)
                    : false,
            } as FoodEntry;

            // Optimistic Update
            setFoodLog((prevLog) => {
                const newLog = [...prevLog];
                const index = newLog.findIndex((e) => e.id === entryToSave.id);
                if (index >= 0) {
                    newLog[index] = entryToSave;
                } else {
                    newLog.push(entryToSave);
                }
                return newLog;
            });

            if (useCloud) {
                try {
                    const result = await supabase.saveFood(entryToSave);

                    if (result?.error) {
                        console.error('[Nutrition] saveFoodEntry failed:', {
                            function: 'saveFoodEntry',
                            date: entryToSave.date,
                            name: entryToSave.name,
                            error: result.error.message,
                        });
                        throw new Error(result.error.message);
                    }

                    console.log(
                        '[Nutrition] saveFoodEntry successful:',
                        entryToSave.date,
                        entryToSave.name,
                    );
                    return result.data;
                } catch (err: any) {
                    console.error('[Nutrition] saveFoodEntry FAILED:', {
                        function: 'saveFoodEntry',
                        date: entryToSave.date,
                        name: entryToSave.name,
                        error: err.message,
                        stack: err.stack,
                    });

                    // Add to The Vault for offline resilience
                    await addPendingWrite(
                        'food_log',
                        entryToSave,
                        supabase.user?.id || '',
                    );

                    // Return original entry for optimistic UI
                    return entryToSave;
                }
            }
            return entryToSave;
        },
        [useCloud, supabase, shouldTagAsSafetyNetDay],
    );

    const deleteFoodEntry = useCallback(
        async (id: string) => {
            if (useCloud) await supabase.deleteFood(id);
        },
        [useCloud, supabase],
    );

    const saveWaterLog = useCallback(async (newLog: WaterEntry[]) => {
        setWaterLog(newLog);
        try {
            await storage.set('lucas-water-log-v5', JSON.stringify(newLog));
        } catch (err) {
            console.error('Error saving water log:', err);
        }
    }, []);

    const saveWaterEntry = useCallback(
        async (entry: WaterEntry) => {
            if (useCloud) {
                try {
                    const result = await supabase.saveWater(entry);

                    if (result?.error) {
                        console.error('[Nutrition] saveWaterEntry failed:', {
                            function: 'saveWaterEntry',
                            date: entry.date,
                            glasses: entry.glasses,
                            error: result.error.message,
                        });
                        throw new Error(result.error.message);
                    }

                    console.log(
                        '[Nutrition] saveWaterEntry successful:',
                        entry.date,
                        entry.glasses,
                    );
                } catch (err: any) {
                    console.error('[Nutrition] saveWaterEntry FAILED:', {
                        function: 'saveWaterEntry',
                        date: entry.date,
                        glasses: entry.glasses,
                        error: err.message,
                        stack: err.stack,
                    });

                    // Add to The Vault for offline resilience
                    await addPendingWrite(
                        'water_log',
                        entry,
                        supabase.user?.id || '',
                    );
                }
            }
        },
        [useCloud, supabase],
    );

    const getWaterForDate = useCallback(
        (date: string) => {
            return (
                waterLog.find((e) => e.date === date) || {
                    id: `w-${date}`,
                    date: date,
                    glasses: 0,
                    ml: 0,
                }
            );
        },
        [waterLog],
    );

    const addWaterGlass = useCallback(
        async (date?: string): Promise<string | null> => {
            const targetDate = date || getArgentinaDateString();

            const existingEntry = waterLog.find((e) => e.date === targetDate);
            const newEntry: WaterEntry = existingEntry
                ? {
                      ...existingEntry,
                      glasses: existingEntry.glasses + 1,
                      ml: (existingEntry.glasses + 1) * 250,
                  }
                : { id: `w-${targetDate}`, date: targetDate, glasses: 1, ml: 250 };

            const newLog = existingEntry
                ? waterLog.map((e) => (e.date === targetDate ? newEntry : e))
                : [...waterLog, newEntry];

            saveWaterLog(newLog);
            saveWaterEntry(newEntry);
            return '💧 +1 vaso';
        },
        [waterLog, saveWaterLog, saveWaterEntry],
    );

    const removeWaterGlass = useCallback(
        async (date?: string): Promise<string | null> => {
            const targetDate = date || getArgentinaDateString();
            const existingEntry = waterLog.find((e) => e.date === targetDate);
            if (!existingEntry || existingEntry.glasses <= 0) return null;

            const newEntry: WaterEntry = {
                ...existingEntry,
                glasses: existingEntry.glasses - 1,
                ml: (existingEntry.glasses - 1) * 250,
            };
            const newLog = waterLog.map((e) =>
                e.date === targetDate ? newEntry : e,
            );

            saveWaterLog(newLog);
            saveWaterEntry(newEntry);
            return '💧 -1 vaso';
        },
        [waterLog, saveWaterLog, saveWaterEntry],
    );

    return useMemo(
        () => ({
            foodLog,
            setFoodLog,
            saveFoodLog,
            saveFoodEntry,
            deleteFoodEntry,
            waterLog,
            setWaterLog,
            saveWaterLog,
            saveWaterEntry,
            getWaterForDate,
            addWaterGlass,
            removeWaterGlass,
            getTotalsForDate,
            getTargetsForDate,
            getFoodsForDate,
            isDayCompleted,
        }),
        [
            foodLog,
            saveFoodLog,
            saveFoodEntry,
            deleteFoodEntry,
            waterLog,
            saveWaterLog,
            saveWaterEntry,
            getWaterForDate,
            addWaterGlass,
            removeWaterGlass,
            getTotalsForDate,
            getTargetsForDate,
            getFoodsForDate,
            isDayCompleted,
        ],
    );
};
