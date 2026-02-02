/**
 * ShareModal - Modal for creating and sharing transformation stories
 * Sprint 3: Social Sharing & Transformation Posts
 */

import { X } from 'lucide-react';
import React, { useState } from 'react';
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
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        Compartir Transformación
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Caption Generator */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-3">
                            1. Generá tu caption
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
                            <h3 className="font-bold text-slate-900 mb-3">
                                2. Vista previa
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
                                💡 <strong>Tip:</strong> La IA generará un caption
                                personalizado basado en tu progreso. Podés editarlo
                                después de generarlo.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
