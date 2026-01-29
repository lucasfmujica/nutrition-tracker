import { X } from 'lucide-react';
import React from 'react';
import { FoodCameraInput } from '../Food/FoodCameraInput';

interface FoodCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FoodCameraModal: React.FC<FoodCameraModalProps> = ({
    isOpen,
    onClose,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 pt-12 sm:pt-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg relative mb-24 sm:mb-4">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                    <X size={20} />
                </button>

                {/* Modal Content - scrollable on mobile */}
                <div className="p-1 max-h-[80vh] overflow-y-auto">
                    <FoodCameraInput />
                </div>
            </div>
        </div>
    );
};
