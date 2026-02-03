import { useState } from 'react';
import { useTracker } from '../../context/TrackerContext';
import { WeightEntry } from '../../types/domain';
import {
    getArgentinaDateString,
    getArgentinaTimestamp,
} from '../../utils/dateUtils';
import { parseWeightToKg } from '../../utils/unitUtils';

export const useWeightForm = () => {
    const { weightHistory, saveWeightHistory, saveWeightEntry, unitSystem } =
        useTracker();

    const [weight, setWeight] = useState<string>('');
    const [time, setTime] = useState<string>('09:00');
    const [date, setDate] = useState<string>(getArgentinaDateString());
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');

        if (!weight) {
            setError('Ingresá un peso válido');
            return;
        }

        try {
            const timestamp = getArgentinaTimestamp(date, time);

            const entry: WeightEntry = {
                id: `wh-${Date.now()}`,
                date: date,
                weight: parseWeightToKg(weight, unitSystem),
                timestamp: timestamp,
            };

            // Append new entry to history
            const newHistory = [...weightHistory, entry];

            // Save everything
            await saveWeightHistory(newHistory);
            await saveWeightEntry(entry);

            // Clear weight input only, keep date/time for convenience or reset?
            // Resetting weight indicates success visually
            setWeight('');
        } catch (err) {
            setError('Error al guardar');
            console.error(err);
        }
    };

    return {
        weight,
        setWeight,
        time,
        setTime,
        date,
        setDate,
        error,
        setError,
        handleSubmit,
    };
};
