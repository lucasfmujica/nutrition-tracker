/**
 * ShareModal - Modal for creating and sharing transformation stories
 * Sprint 3: Social Sharing & Transformation Posts
 */

import { X } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProgressPhoto } from '../../types/domain';
import { CaptionGenerator } from './CaptionGenerator';
import { TransformationStoryCard } from './TransformationStoryCard';

interface ShareModalProps {
    beforePhoto: ProgressPhoto;
    afterPhoto: ProgressPhoto;
    goal?: 'cut' | 'maintain' | 'bulk';
    measurements?: {
        waistChange?: number;
        bodyFatChange?: number;
        chestChange?: number;
    };
    onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    beforePhoto,
    afterPhoto,
    goal = 'cut',
    measurements,
    onClose,
}) => {
    const { t } = useTranslation();

    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);

    const handleCaptionGenerated = (newCaption: string, newHashtags: string[]) => {
        setCaption(newCaption);
        setHashtags(newHashtags);
    };

    const handleShare = () => {
        // This will trigger the Web Share API in TransformationStoryCard
        // Or could integrate with activity feed here
        console.log('Sharing transformation:', { caption, hashtags });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-surface rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-text-primary">
                        {t('progress.share.title')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-surface-lighter rounded-lg transition-colors">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Caption Generator */}
                    <div>
                        <h3 className="font-bold text-text-primary mb-3">
                            {t('progress.share.createCaption')}
                        </h3>
                        <CaptionGenerator
                            beforePhoto={beforePhoto}
                            afterPhoto={afterPhoto}
                            goal={goal}
                            measurements={measurements}
                            onCaptionGenerated={handleCaptionGenerated}
                        />
                    </div>

                    {/* Preview */}
                    {caption && (
                        <div>
                            <h3 className="font-bold text-text-primary mb-3">
                                {t('progress.share.preview')}
                            </h3>
                            <TransformationStoryCard
                                beforePhoto={beforePhoto}
                                afterPhoto={afterPhoto}
                                caption={caption}
                                measurements={measurements}
                                onShare={handleShare}
                            />
                        </div>
                    )}

                    {/* Info */}
                    {!caption && (
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-sm text-blue-700">
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: t('progress.share.tip'),
                                    }}
                                />
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
