import { ChevronDown, ChevronUp, Dumbbell, Flame, Scale, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { Friend } from '../../types/domain';

interface FriendCardProps {
    friend: Friend;
    onRemove: (friendshipId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({ friend, onRemove }) => {
    const [expanded, setExpanded] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const formatWeightDelta = (delta: number | null | undefined): string => {
        if (delta === null || delta === undefined) return 'N/A';
        const sign = delta < 0 ? '' : '+';
        return `${sign}${delta.toFixed(1)} kg`;
    };

    const getWeightDeltaColor = (delta: number | null | undefined): string => {
        if (delta === null || delta === undefined) return 'text-slate-400';
        if (delta < 0) return 'text-green-600';
        if (delta > 0) return 'text-red-500';
        return 'text-slate-400';
    };

    const handleRemove = () => {
        if (showConfirm) {
            onRemove(friend.id);
            setShowConfirm(false);
        } else {
            setShowConfirm(true);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden transition-all">
            {/* Main Row */}
            <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(!expanded)}>
                {/* Avatar */}
                {friend.avatar ? (
                    <img
                        src={friend.avatar}
                        alt={friend.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary/80 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {friend.name.charAt(0).toUpperCase()}
                    </div>
                )}

                {/* Name & Stats Preview */}
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{friend.name}</p>
                    <p className="text-xs text-slate-400">
                        {friend.weeklyStats ? (
                            <span className={getWeightDeltaColor(friend.weeklyStats.weightDelta)}>
                                {formatWeightDelta(friend.weeklyStats.weightDelta)} esta semana
                            </span>
                        ) : (
                            'Sin datos esta semana'
                        )}
                    </p>
                </div>

                {/* Expand Toggle */}
                <div className="text-slate-400">
                    {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-50 pt-3">
                    {friend.weeklyStats ? (
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            {/* Weight Delta */}
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <Scale size={16} className="mx-auto mb-1 text-slate-400" />
                                <p
                                    className={`font-black text-sm ${getWeightDeltaColor(friend.weeklyStats.weightDelta)}`}>
                                    {formatWeightDelta(friend.weeklyStats.weightDelta)}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase">Peso</p>
                            </div>

                            {/* Workouts */}
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <Dumbbell size={16} className="mx-auto mb-1 text-slate-400" />
                                <p className="font-black text-sm text-slate-700">
                                    {friend.weeklyStats.workoutCount}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase">Entrenos</p>
                            </div>

                            {/* Streak */}
                            <div className="bg-slate-50 rounded-lg p-3 text-center">
                                <Flame size={16} className="mx-auto mb-1 text-slate-400" />
                                <p className="font-black text-sm text-orange-500">
                                    {friend.weeklyStats.consistencyStreak}
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase">Racha</p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-400 text-center py-4">
                            Sin estadísticas disponibles
                        </p>
                    )}

                    {/* Remove Friend Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                            showConfirm
                                ? 'bg-red-500 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500'
                        }`}>
                        <Trash2 size={16} />
                        {showConfirm ? 'Confirmar eliminación' : 'Eliminar amigo'}
                    </button>
                </div>
            )}
        </div>
    );
};
