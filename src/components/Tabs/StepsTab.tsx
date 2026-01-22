import React from 'react';
import { StepsEntry } from '../../types/domain';
import { SimpleBarChart } from '../Charts/SimpleBarChart';
import { LukenFitDatePicker } from '../UI/LukenFitDatePicker';

interface StepsTabProps {
    stepsDate: string;
    setStepsDate: (date: string) => void;
    newSteps: string;
    setNewSteps: (steps: string) => void;
    addStepsEntry: () => void;
    weeklyData: any[];
    stepsLog: StepsEntry[];
}

/**
 * StepsTab - Steps tracking and history
 */
export const StepsTab: React.FC<StepsTabProps> = ({
    stepsDate,
    setStepsDate,
    newSteps,
    setNewSteps,
    addStepsEntry,
    weeklyData,
    stepsLog,
}) => {
    return (
        <div className="w-full space-y-6">
            <div className="mb-2 px-1">
                <h1 className="text-2xl font-bold text-gray-900">Pasos</h1>
                <p className="text-sm text-gray-500">Actividad diaria</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        👟
                    </span>
                    REGISTRAR PASOS
                </h2>
                <div className="mb-3">
                    <LukenFitDatePicker
                        selectedDate={stepsDate}
                        onChange={setStepsDate}
                        label="Fecha"
                    />
                </div>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={newSteps}
                        onChange={(e) => setNewSteps(e.target.value)}
                        placeholder="ej: 8500"
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-lg font-black focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all placeholder-gray-300"
                    />
                    <button
                        onClick={addStepsEntry}
                        className="bg-orange-600 hover:bg-orange-700 active:bg-orange-800 px-8 py-3 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all">
                        OK
                    </button>
                </div>
            </div>

            <SimpleBarChart
                data={weeklyData}
                dataKey="steps"
                target={8000}
                color="bg-cyan-500"
                label="Pasos 7 días"
            />

            {stepsLog.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs">
                            📊
                        </span>
                        HISTORIAL
                    </h2>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {stepsLog.slice(0, 14).map((entry, idx) => (
                            <div
                                key={idx}
                                className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 text-sm">
                                <span className="text-slate-500 font-medium">
                                    {entry.date}
                                </span>
                                <span
                                    className={`font-black text-base ${entry.steps >= 8000 ? 'text-cyan-600' : 'text-slate-400'}`}>
                                    {entry.steps.toLocaleString()}
                                    <span className="text-[10px] font-bold ml-1 text-slate-300 uppercase">
                                        pasos
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
