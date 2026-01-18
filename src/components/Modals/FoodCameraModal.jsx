import { X } from 'lucide-react';
import React from 'react';
import { FoodCameraInput } from '../Food/FoodCameraInput';

export const FoodCameraModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30 backdrop-blur-sm transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Content */}
        <div className="p-1">
          <FoodCameraInput />
        </div>
      </div>
    </div>
  );
};
