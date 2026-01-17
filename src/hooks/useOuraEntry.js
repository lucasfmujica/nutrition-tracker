import { useState } from 'react';
import { getArgentinaDateString } from '../utils/dateUtils';

export const useOuraEntry = ({ ouraLog, saveOuraLog, saveOuraEntry }) => {
  const [newOuraEntry, setNewOuraEntry] = useState({
    date: getArgentinaDateString(),
    sleepScore: '',
    readinessScore: '',
    activityScore: '',
    hrv: '',
    restingHr: '',
    sleepHours: '',
    deepSleepMins: '',
    remSleepMins: '',
    bedtime: '',
    wakeTime: ''
  });

  const addOuraEntry = async () => {
    if (!newOuraEntry.sleepScore) return;

    const existingIndex = ouraLog.findIndex(o => o.date === newOuraEntry.date);
    const entry = {
      id: existingIndex >= 0 ? ouraLog[existingIndex].id : `oura-${newOuraEntry.date}`,
      date: newOuraEntry.date,
      sleepScore: parseInt(newOuraEntry.sleepScore) || 0,
      readinessScore: parseInt(newOuraEntry.readinessScore) || 0,
      activityScore: parseInt(newOuraEntry.activityScore) || 0,
      hrv: parseInt(newOuraEntry.hrv) || 0,
      restingHr: parseInt(newOuraEntry.restingHr) || 0,
      sleepHours: parseFloat(newOuraEntry.sleepHours) || 0,
      deepSleepMins: parseInt(newOuraEntry.deepSleepMins) || null,
      remSleepMins: parseInt(newOuraEntry.remSleepMins) || null,
      bedtime: newOuraEntry.bedtime || null,
      wakeTime: newOuraEntry.wakeTime || null
    };

    let newLog;
    if (existingIndex >= 0) {
      newLog = [...ouraLog];
      newLog[existingIndex] = entry;
    } else {
      newLog = [...ouraLog, entry];
    }
    newLog.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Optimistic update to local state
    saveOuraLog(newLog);

    // Attempt cloud sync with error handling
    try {
      await saveOuraEntry(entry);
      console.log('[OuraEntry] Cloud sync successful for:', entry.date);
    } catch (err) {
      console.error('[OuraEntry] Cloud sync FAILED:', {
        function: 'addOuraEntry',
        date: entry.date,
        error: err.message
      });

      // TODO: Update global syncError state for UI notification
      // For now, log prominently for visibility
      console.warn('⚠️ OURA DATA NOT SYNCED TO CLOUD - Local only ⚠️');
    }

    setNewOuraEntry({
      date: getArgentinaDateString(),
      sleepScore: '', readinessScore: '', activityScore: '',
      hrv: '', restingHr: '', sleepHours: '',
      deepSleepMins: '', remSleepMins: '', bedtime: '', wakeTime: ''
    });
  };

  return {
    newOuraEntry,
    setNewOuraEntry,
    addOuraEntry
  };
};
