import React from 'react';
import { FoodCameraInput } from '../Food/FoodCameraInput';
import { ModalShell } from '../UI/ModalShell';

interface FoodCameraModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FoodCameraModal: React.FC<FoodCameraModalProps> = ({
    isOpen,
    onClose,
}) => (
    <ModalShell open={isOpen} onClose={onClose} size="md">
        <FoodCameraInput />
    </ModalShell>
);
