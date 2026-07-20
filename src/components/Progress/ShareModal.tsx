/**
 * ShareModal - Modal for creating and sharing transformation stories
 * Sprint 3: Social Sharing & Transformation Posts
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProgressPhoto } from '../../types/domain';
import { ModalShell } from '../UI/ModalShell';
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
        <ModalShell
            open
            onClose={onClose}
            title={t('progress.share.title')}
            size="lg">
            <div className="space-y-6">
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
                    <div className="bg-primary-soft rounded-card p-4 border border-primary/20">
                        <p className="text-sm text-primary">
                            <span
                                dangerouslySetInnerHTML={{
                                    __html: t('progress.share.tip'),
                                }}
                            />
                        </p>
                    </div>
                )}
            </div>
        </ModalShell>
    );
};
