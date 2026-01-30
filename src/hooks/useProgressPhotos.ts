/**
 * useProgressPhotos Hook
 * Manages progress photos with Supabase Storage
 * Handles image upload, compression, and metadata storage
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { ProgressPhoto, PhotoAngle } from '../types/domain';
import { getArgentinaDateString } from '../utils/dateUtils';

interface UseProgressPhotosParams {
    userId: string | null;
}

interface UseProgressPhotosReturn {
    photos: ProgressPhoto[];
    isLoading: boolean;
    isUploading: boolean;
    error: string | null;

    // Actions
    uploadPhoto: (
        file: File,
        options?: { date?: string; angle?: PhotoAngle; notes?: string; weight?: number }
    ) => Promise<ProgressPhoto | null>;
    deletePhoto: (id: string) => Promise<boolean>;
    updatePhoto: (id: string, updates: Partial<ProgressPhoto>) => Promise<boolean>;
    getPhotosForDate: (date: string) => ProgressPhoto[];
    getPhotosForDateRange: (startDate: string, endDate: string) => ProgressPhoto[];
    refreshPhotos: () => Promise<void>;
}

const STORAGE_BUCKET = 'progress-photos';
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const THUMBNAIL_SIZE = 300;

// Map DB row to domain type
const mapDbToPhoto = (row: any): ProgressPhoto => ({
    id: row.id,
    date: row.date,
    photoUrl: row.photo_url,
    thumbnailUrl: row.thumbnail_url,
    angle: row.angle,
    notes: row.notes,
    weight: row.weight,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

/**
 * Compress image using canvas
 */
const compressImage = async (file: File, maxWidth: number = 1200): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to compress image'));
                    }
                },
                'image/jpeg',
                0.85 // Quality
            );
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = URL.createObjectURL(file);
    });
};

/**
 * Create thumbnail from image
 */
const createThumbnail = async (file: File): Promise<Blob> => {
    return compressImage(file, THUMBNAIL_SIZE);
};

export const useProgressPhotos = ({
    userId,
}: UseProgressPhotosParams): UseProgressPhotosReturn => {
    const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch photos from Supabase
    const fetchPhotos = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await (supabase as any)
                .from('progress_photos')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            if (fetchError) throw fetchError;

            const mapped = (data || []).map(mapDbToPhoto);
            setPhotos(mapped);
        } catch (err: any) {
            console.error('[useProgressPhotos] Fetch error:', err);
            setError('Error al cargar fotos');
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Upload photo
    const uploadPhoto = useCallback(
        async (
            file: File,
            options?: { date?: string; angle?: PhotoAngle; notes?: string; weight?: number }
        ): Promise<ProgressPhoto | null> => {
            if (!userId) return null;

            // Validate file size
            if (file.size > MAX_IMAGE_SIZE) {
                setError('La imagen es muy grande (máx 5MB)');
                return null;
            }

            setIsUploading(true);
            setError(null);

            try {
                const date = options?.date || getArgentinaDateString();
                const timestamp = Date.now();
                const fileExt = file.name.split('.').pop() || 'jpg';

                // Compress image
                const compressedBlob = await compressImage(file);
                const thumbnailBlob = await createThumbnail(file);

                // Generate unique filenames
                const photoPath = `${userId}/${date}/${timestamp}.${fileExt}`;
                const thumbPath = `${userId}/${date}/${timestamp}_thumb.${fileExt}`;

                // Upload main photo
                const { error: uploadError } = await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(photoPath, compressedBlob, {
                        contentType: 'image/jpeg',
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                // Upload thumbnail
                await supabase.storage
                    .from(STORAGE_BUCKET)
                    .upload(thumbPath, thumbnailBlob, {
                        contentType: 'image/jpeg',
                        upsert: false,
                    });

                // Get public URLs
                const { data: photoUrlData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(photoPath);

                const { data: thumbUrlData } = supabase.storage
                    .from(STORAGE_BUCKET)
                    .getPublicUrl(thumbPath);

                // Save metadata to database
                const { data: insertedData, error: insertError } = await (supabase as any)
                    .from('progress_photos')
                    .insert({
                        user_id: userId,
                        date,
                        photo_url: photoUrlData.publicUrl,
                        thumbnail_url: thumbUrlData.publicUrl,
                        angle: options?.angle || null,
                        notes: options?.notes || null,
                        weight: options?.weight || null,
                    })
                    .select()
                    .single();

                if (insertError) throw insertError;

                const newPhoto = mapDbToPhoto(insertedData);

                // Update local state
                setPhotos((prev) => [newPhoto, ...prev].sort(
                    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
                ));

                return newPhoto;
            } catch (err: any) {
                console.error('[useProgressPhotos] Upload error:', err);
                setError('Error al subir foto');
                return null;
            } finally {
                setIsUploading(false);
            }
        },
        [userId]
    );

    // Delete photo
    const deletePhoto = useCallback(
        async (id: string): Promise<boolean> => {
            if (!userId) return false;

            try {
                // Get photo info first to delete from storage
                const photo = photos.find((p) => p.id === id);
                if (!photo) return false;

                // Delete from database
                const { error: deleteError } = await (supabase as any)
                    .from('progress_photos')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId);

                if (deleteError) throw deleteError;

                // Try to delete from storage (best effort)
                try {
                    const photoPath = photo.photoUrl.split('/').slice(-3).join('/');
                    const thumbPath = photo.thumbnailUrl?.split('/').slice(-3).join('/');

                    await supabase.storage.from(STORAGE_BUCKET).remove([photoPath]);
                    if (thumbPath) {
                        await supabase.storage.from(STORAGE_BUCKET).remove([thumbPath]);
                    }
                } catch (storageErr) {
                    console.warn('[useProgressPhotos] Storage cleanup error:', storageErr);
                }

                // Update local state
                setPhotos((prev) => prev.filter((p) => p.id !== id));

                return true;
            } catch (err: any) {
                console.error('[useProgressPhotos] Delete error:', err);
                setError('Error al eliminar foto');
                return false;
            }
        },
        [userId, photos]
    );

    // Update photo metadata
    const updatePhoto = useCallback(
        async (id: string, updates: Partial<ProgressPhoto>): Promise<boolean> => {
            if (!userId) return false;

            try {
                const dbUpdates: any = {};
                if (updates.angle !== undefined) dbUpdates.angle = updates.angle;
                if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
                if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
                dbUpdates.updated_at = new Date().toISOString();

                const { error: updateError } = await (supabase as any)
                    .from('progress_photos')
                    .update(dbUpdates)
                    .eq('id', id)
                    .eq('user_id', userId);

                if (updateError) throw updateError;

                // Update local state
                setPhotos((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: dbUpdates.updated_at } : p))
                );

                return true;
            } catch (err: any) {
                console.error('[useProgressPhotos] Update error:', err);
                setError('Error al actualizar foto');
                return false;
            }
        },
        [userId]
    );

    // Get photos for specific date
    const getPhotosForDate = useCallback(
        (date: string) => photos.filter((p) => p.date === date),
        [photos]
    );

    // Get photos for date range
    const getPhotosForDateRange = useCallback(
        (startDate: string, endDate: string) =>
            photos.filter((p) => p.date >= startDate && p.date <= endDate),
        [photos]
    );

    return {
        photos,
        isLoading,
        isUploading,
        error,
        uploadPhoto,
        deletePhoto,
        updatePhoto,
        getPhotosForDate,
        getPhotosForDateRange,
        refreshPhotos: fetchPhotos,
    };
};
