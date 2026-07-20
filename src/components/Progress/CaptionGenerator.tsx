/**
 * CaptionGenerator - AI-powered caption generation interface
 * Sprint 3: Social Sharing & Transformation Posts
 */

import { Loader2, RefreshCw, Sparkles } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    generateTransformationCaption,
    regenerateCaption,
} from '../../services/ai/transformationService';
import type { ProgressPhoto } from '../../types/domain';
import { calculatePhotoStats } from '../../utils/progressUtils';

interface CaptionGeneratorProps {
    beforePhoto: ProgressPhoto;
    afterPhoto: ProgressPhoto;
    goal: 'cut' | 'maintain' | 'bulk';
    measurements?: {
        waistChange?: number;
        bodyFatChange?: number;
        chestChange?: number;
    };
    onCaptionGenerated: (caption: string, hashtags: string[]) => void;
}

export const CaptionGenerator: React.FC<CaptionGeneratorProps> = ({
    beforePhoto,
    afterPhoto,
    goal,
    measurements,
    onCaptionGenerated,
}) => {
    const { t, i18n } = useTranslation();
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [previousCaptions, setPreviousCaptions] = useState<string[]>([]);

    const stats = calculatePhotoStats(beforePhoto, afterPhoto);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const transformationData = {
                beforePhoto,
                afterPhoto,
                weightChange: stats.weightChange,
                daysDuration: stats.daysDuration,
                goal,
                measurements,
            };

            const result = await generateTransformationCaption(transformationData, {
                language: i18n.language,
            });
            setCaption(result.caption);
            setHashtags(result.hashtags);
            setPreviousCaptions([...previousCaptions, result.caption]);
            onCaptionGenerated(result.caption, result.hashtags);
        } catch (error) {
            console.error('Error generating caption:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerate = async () => {
        setIsGenerating(true);
        try {
            const transformationData = {
                beforePhoto,
                afterPhoto,
                weightChange: stats.weightChange,
                daysDuration: stats.daysDuration,
                goal,
                measurements,
            };

            const result = await regenerateCaption(
                transformationData,
                previousCaptions,
                i18n.language,
            );
            setCaption(result.caption);
            setHashtags(result.hashtags);
            setPreviousCaptions([...previousCaptions, result.caption]);
            onCaptionGenerated(result.caption, result.hashtags);
        } catch (error) {
            console.error('Error regenerating caption:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCaptionChange = (newCaption: string) => {
        setCaption(newCaption);
        onCaptionGenerated(newCaption, hashtags);
    };

    return (
        <div className="space-y-4">
            {/* Generate Button */}
            {!caption && (
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50">
                    {isGenerating ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            {t('captionGenerator.generating')}
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            {t('captionGenerator.generate')}
                        </>
                    )}
                </button>
            )}

            {/* Caption Display/Edit */}
            {caption && (
                <div className="bg-surface rounded-2xl p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-text-secondary">
                            {t('captionGenerator.caption')}
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="text-xs text-oura font-bold hover:opacity-80">
                                {isEditing
                                    ? t('captionGenerator.save')
                                    : t('captionGenerator.edit')}
                            </button>
                            <button
                                onClick={handleRegenerate}
                                disabled={isGenerating}
                                className="flex items-center gap-1 text-xs text-text-secondary font-bold hover:text-text-secondary disabled:opacity-50">
                                <RefreshCw
                                    size={12}
                                    className={isGenerating ? 'animate-spin' : ''}
                                />
                                {t('captionGenerator.regenerate')}
                            </button>
                        </div>
                    </div>

                    {isEditing ? (
                        <textarea
                            value={caption}
                            onChange={(e) => handleCaptionChange(e.target.value)}
                            className="w-full p-3 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-oura"
                            rows={3}
                            placeholder={t('captionGenerator.placeholder')}
                        />
                    ) : (
                        <p className="text-sm text-text-primary leading-relaxed">
                            {caption}
                        </p>
                    )}

                    {/* Hashtags */}
                    {hashtags.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                            <div className="flex flex-wrap gap-2">
                                {hashtags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-1 bg-oura-soft text-oura rounded-lg text-xs font-bold">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
