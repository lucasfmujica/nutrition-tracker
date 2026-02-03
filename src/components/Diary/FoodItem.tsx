import { Star } from 'lucide-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FoodEntry } from '../../types/domain';
import { SwipeableItem } from '../UI/SwipeableItem';

interface FoodItemProps {
    food: FoodEntry;
    onEdit: () => void;
    onDelete: () => void;
    onTemplate: () => void;
    onDuplicate?: () => void;
    isFavorite: boolean;
}

export const FoodItem: React.FC<FoodItemProps> = ({
    food,
    onEdit,
    onDelete,
    onTemplate,
    onDuplicate,
    isFavorite,
}) => {
    const { t } = useTranslation();
    const needsReview =
        !food.reviewed || (food.confidence !== undefined && food.confidence < 0.7);

    return (
        <SwipeableItem onDelete={onDelete} onDuplicate={onDuplicate}>
            <div
                className={`p-3 bg-white border-b border-gray-50 flex justify-between items-center ${needsReview ? 'bg-amber-50/50' : ''}`}>
                <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-gray-900 font-medium truncate">
                            {food.name}
                        </h4>
                        {needsReview && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                        {food.description || ''}
                    </p>
                </div>

                <div className="text-right flex-shrink-0">
                    <span className="block text-gray-900 font-bold">
                        {food.calories}
                    </span>
                    <div className="flex gap-1 justify-end text-[10px] text-gray-400 font-medium uppercase">
                        <span className="text-green-600">{food.protein}p</span>
                        <span className="text-amber-500">{food.carbs}c</span>
                        <span className="text-orange-500">{food.fat}f</span>
                    </div>
                </div>

                <div className="flex items-center">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTemplate();
                        }}
                        className={`ml-3 p-1.5 transition-colors ${isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-400'}`}
                        title={
                            isFavorite
                                ? t('diary.foodItem.removeFavorite')
                                : t('diary.foodItem.saveFavorite')
                        }>
                        <Star
                            size={16}
                            fill={isFavorite ? 'currentColor' : 'none'}
                        />
                    </button>
                    <button
                        onClick={onEdit}
                        className="ml-1 p-1.5 text-gray-400 hover:text-blue-500 transition-colors"
                        title={t('diary.foodItem.edit')}>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </button>
                    <button
                        onClick={onDelete}
                        className="ml-1 p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        title={t('diary.foodItem.delete')}>
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </SwipeableItem>
    );
};
