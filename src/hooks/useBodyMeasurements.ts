/**
 * useBodyMeasurements Hook
 * Manages body measurements data (chest, waist, hips, etc.)
 * Follows SSOT pattern with Supabase as source of truth
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { BodyMeasurement } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

interface UseBodyMeasurementsParams {
    userId: string | null;
}

interface UseBodyMeasurementsReturn {
    measurements: BodyMeasurement[];
    isLoading: boolean;
    error: string | null;
    latestMeasurement: BodyMeasurement | null;

    // Actions
    saveMeasurement: (measurement: Partial<BodyMeasurement>) => Promise<BodyMeasurement | null>;
    updateMeasurement: (id: string, updates: Partial<BodyMeasurement>) => Promise<boolean>;
    deleteMeasurement: (id: string) => Promise<boolean>;
    getMeasurementForDate: (date: string) => BodyMeasurement | undefined;
    refreshMeasurements: () => Promise<void>;
}

// Map DB row to domain type
const mapDbToMeasurement = (row: any): BodyMeasurement => ({
    id: row.id,
    date: row.date,
    chest: row.chest,
    shoulders: row.shoulders,
    bicepsLeft: row.biceps_left,
    bicepsRight: row.biceps_right,
    forearmLeft: row.forearm_left,
    forearmRight: row.forearm_right,
    waist: row.waist,
    hips: row.hips,
    thighLeft: row.thigh_left,
    thighRight: row.thigh_right,
    calfLeft: row.calf_left,
    calfRight: row.calf_right,
    neck: row.neck,
    bodyFatPercent: row.body_fat_percent,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

// Map domain type to DB row
const mapMeasurementToDb = (m: Partial<BodyMeasurement>, userId: string) => ({
    user_id: userId,
    date: m.date || getArgentinaDateString(),
    chest: m.chest || null,
    shoulders: m.shoulders || null,
    biceps_left: m.bicepsLeft || null,
    biceps_right: m.bicepsRight || null,
    forearm_left: m.forearmLeft || null,
    forearm_right: m.forearmRight || null,
    waist: m.waist || null,
    hips: m.hips || null,
    thigh_left: m.thighLeft || null,
    thigh_right: m.thighRight || null,
    calf_left: m.calfLeft || null,
    calf_right: m.calfRight || null,
    neck: m.neck || null,
    body_fat_percent: m.bodyFatPercent || null,
    notes: m.notes || null,
});

export const useBodyMeasurements = ({
    userId,
}: UseBodyMeasurementsParams): UseBodyMeasurementsReturn => {
    const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch measurements from Supabase
    const fetchMeasurements = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await (supabase as any)
                .from('body_measurements')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            const mapped = (data || []).map(mapDbToMeasurement);
            setMeasurements(mapped);
        } catch (err: any) {
            console.error('[useBodyMeasurements] Fetch error:', err);
            setError('Error al cargar medidas');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        fetchMeasurements();
    }, [fetchMeasurements]);

    // Get latest measurement
    const latestMeasurement = measurements.length > 0 ? measurements[0] : null;

    // Get measurement for specific date
    const getMeasurementForDate = useCallback(
        (date: string) => measurements.find((m) => m.date === date),
        [measurements]
    );

    // Save new measurement
    const saveMeasurement = useCallback(
        async (measurement: Partial<BodyMeasurement>): Promise<BodyMeasurement | null> => {
            if (!userId) return null;

            try {
                const dbData = mapMeasurementToDb(measurement, userId);

                const { data, error: insertError } = await (supabase as any)
                    .from('body_measurements')
                    .insert(dbData)
                    .select()
                    .single();

                if (insertError) throw insertError;

                const newMeasurement = mapDbToMeasurement(data);

                // Update local state
                setMeasurements((prev) => [newMeasurement, ...prev].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                ));

                return newMeasurement;
            } catch (err: any) {
                console.error('[useBodyMeasurements] Save error:', err);
                setError('Error al guardar medidas');
                return null;
            }
        },
        [userId]
    );

    // Update existing measurement
    const updateMeasurement = useCallback(
        async (id: string, updates: Partial<BodyMeasurement>): Promise<boolean> => {
            if (!userId) return false;

            try {
                const dbUpdates: any = {};
                if (updates.chest !== undefined) dbUpdates.chest = updates.chest;
                if (updates.shoulders !== undefined) dbUpdates.shoulders = updates.shoulders;
                if (updates.bicepsLeft !== undefined) dbUpdates.biceps_left = updates.bicepsLeft;
                if (updates.bicepsRight !== undefined) dbUpdates.biceps_right = updates.bicepsRight;
                if (updates.waist !== undefined) dbUpdates.waist = updates.waist;
                if (updates.hips !== undefined) dbUpdates.hips = updates.hips;
                if (updates.thighLeft !== undefined) dbUpdates.thigh_left = updates.thighLeft;
                if (updates.thighRight !== undefined) dbUpdates.thigh_right = updates.thighRight;
                if (updates.bodyFatPercent !== undefined) dbUpdates.body_fat_percent = updates.bodyFatPercent;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                dbUpdates.updated_at = new Date().toISOString();

                const { error: updateError } = await (supabase as any)
                    .from('body_measurements')
                    .update(dbUpdates)
                    .eq('id', id)
                    .eq('user_id', userId);

                if (updateError) throw updateError;

                // Update local state
                setMeasurements((prev) =>
                    prev.map((m) => (m.id === id ? { ...m, ...updates, updatedAt: dbUpdates.updated_at } : m))
                );

                return true;
            } catch (err: any) {
                console.error('[useBodyMeasurements] Update error:', err);
                setError('Error al actualizar medidas');
                return false;
            }
        },
        [userId]
    );

    // Delete measurement
    const deleteMeasurement = useCallback(
        async (id: string): Promise<boolean> => {
            if (!userId) return false;

            try {
                const { error: deleteError } = await (supabase as any)
                    .from('body_measurements')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (deleteError) throw deleteError;

                // Update local state
                setMeasurements((prev) => prev.filter((m) => m.id !== id));

                return true;
            } catch (err: any) {
                console.error('[useBodyMeasurements] Delete error:', err);
                setError('Error al eliminar medidas');
                return false;
            }
        },
        [userId]
    );

    return {
        measurements,
        isLoading,
        error,
        latestMeasurement,
        saveMeasurement,
        updateMeasurement,
        deleteMeasurement,
        getMeasurementForDate,
        refreshMeasurements: fetchMeasurements,
    };
};
