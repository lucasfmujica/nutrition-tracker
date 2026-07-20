import React, { ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
    FoodEntry,
    StepsEntry,
    WeightEntry,
    Workout,
} from '../../types/domain';

interface DataExportSectionProps {
    weightHistory: WeightEntry[];
    foodLog: FoodEntry[];
    workoutLog: Workout[];
    stepsLog: StepsEntry[];
    exportForClaude: () => void;
    exportForNutritionist: () => void;
    exportBackup: () => void;
    importBackup: (e: ChangeEvent<HTMLInputElement>) => void;
    exportForBiometrics: () => void;
}

/**
 * DataExportSection - Export/import buttons and data count stats.
 */
export const DataExportSection: React.FC<DataExportSectionProps> = ({
    weightHistory,
    foodLog,
    workoutLog,
    stepsLog,
    exportForClaude,
    exportForNutritionist,
    exportBackup,
    importBackup,
    exportForBiometrics,
}) => {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-2xl p-5 border border-border shadow-sm">
            <h2 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-surface-lighter text-text-secondary flex items-center justify-center">
                    📤
                </span>
                {t('config.export.title')}
            </h2>
            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={exportForClaude}
                    className="bg-info-soft hover:bg-info/20 text-info py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    🤖 {t('config.export.claude')}
                </button>
                <button
                    onClick={exportForNutritionist}
                    className="bg-danger-soft hover:bg-danger/20 text-danger py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    🩺 {t('config.export.nutritionist')}
                </button>
                <button
                    onClick={exportForBiometrics}
                    className="bg-success-soft hover:bg-success/20 text-success py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    📊 {t('config.export.biometrics')}
                </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                    onClick={exportBackup}
                    className="bg-warning-soft hover:bg-warning/20 text-warning py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                    📤 {t('config.export.backup')}
                </button>
                <label className="bg-background hover:bg-surface-lighter text-text-secondary py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors">
                    📥 {t('config.export.import')}
                    <input
                        type="file"
                        accept=".json"
                        onChange={importBackup}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-background rounded-xl">
                    <div className="text-sm font-bold text-text-primary">
                        {weightHistory.length}
                    </div>
                    <div className="text-xs text-text-tertiary font-medium">Peso</div>
                </div>
                <div className="p-2 bg-background rounded-xl">
                    <div className="text-sm font-bold text-text-primary">
                        {foodLog.length}
                    </div>
                    <div className="text-xs text-text-tertiary font-medium">
                        Comidas
                    </div>
                </div>
                <div className="p-2 bg-background rounded-xl">
                    <div className="text-sm font-bold text-text-primary">
                        {workoutLog.length}
                    </div>
                    <div className="text-xs text-text-tertiary font-medium">
                        Entrenos
                    </div>
                </div>
                <div className="p-2 bg-background rounded-xl">
                    <div className="text-sm font-bold text-text-primary">
                        {stepsLog.length}
                    </div>
                    <div className="text-xs text-text-tertiary font-medium">
                        Pasos
                    </div>
                </div>
            </div>

            <p className="text-xs text-text-tertiary mt-4 text-center">
                {t('config.export.warning')}
            </p>
        </div>
    );
};
