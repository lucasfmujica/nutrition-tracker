import { useState } from 'react';
import { storage } from '../utils/storage';

export const useBiometrics = (supabase, useCloud, profileData = null, targetsData = null) => {
  // Initial states aligned with useTrackerData defaults
  const [profile, setProfile] = useState(profileData || {
    height: 173,
    currentWeight: 84.9,
    targetWeight: 75,
    age: 27,
    activityLevel: 'moderate',
    goal: 'cut',
    avatar: '',
    name: ''
  });

  const [customTargets, setCustomTargets] = useState(targetsData || {
    calories: 2100,
    protein: 170,
    carbs: 180,
    fat: 70,
    fiber: 30,
    trainingDayCaloriesBonus: 200,
    trainingDayCarbs: 220
  });

  const [weightHistory, setWeightHistory] = useState([]);
  const [stepsLog, setStepsLog] = useState([]);
  const [ouraLog, setOuraLog] = useState([]);

  // Actions
  const saveProfile = async (newProfile) => {
    setProfile(newProfile);
    try {
      await storage.set('lucas-profile-v5', JSON.stringify(newProfile));
      if (useCloud) {
        await supabase.saveProfile(newProfile, customTargets);
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      throw err; // Allow caller to handle UI feedback
    }
  };

  const saveTargets = async (newTargets) => {
    setCustomTargets(newTargets);
    try {
      await storage.set('lucas-targets-v5', JSON.stringify(newTargets));
      if (useCloud) {
        await supabase.saveProfile(profile, newTargets);
      }
    } catch (err) {
      console.error('Error saving targets:', err);
    }
  };

  const sortWeightHistory = (history) => {
    return [...history].sort((a, b) => {
      const timestampDiff = (b.timestamp || 0) - (a.timestamp || 0);
      if (timestampDiff !== 0) return timestampDiff;
      if (a.date && b.date) return b.date.localeCompare(a.date);
      return 0;
    });
  };

  const getMostRecentWeight = (history = weightHistory) => {
    if (!history || history.length === 0) return null;
    const sorted = sortWeightHistory(history);
    return sorted[0];
  };

  const saveWeightHistory = async (newHistory) => {
    const sorted = sortWeightHistory(newHistory);
    setWeightHistory(sorted);
    try {
      await storage.set('lucas-weight-history-v5', JSON.stringify(sorted));
      const mostRecent = getMostRecentWeight(sorted);
      if (mostRecent) {
        saveProfile({ ...profile, currentWeight: mostRecent.weight });
      }
    } catch (err) {
      console.error('Error saving weight history:', err);
    }
  };

  const saveWeightEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveWeight(entry);

        if (result?.error) {
          console.error('[Biometrics] saveWeightEntry failed:', {
            function: 'saveWeightEntry',
            date: entry.date,
            weight: entry.weight,
            error: result.error.message,
            userId: supabase?.user?.id
          });
          throw new Error(result.error.message);
        }

        console.log('[Biometrics] saveWeightEntry successful:', entry.date);
        return result;
      } catch (err) {
        console.error('[Biometrics] saveWeightEntry FAILED:', {
          function: 'saveWeightEntry',
          date: entry.date,
          weight: entry.weight,
          error: err.message,
          stack: err.stack,
          userId: supabase?.user?.id
        });
        throw err;
      }
    }
  };

  const saveStepsLog = async (newLog) => {
    setStepsLog(newLog);
    try {
      await storage.set('lucas-steps-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving steps log:', err);
    }
  };

  const saveStepsEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveSteps(entry);

        if (result?.error) {
          console.error('[Biometrics] saveStepsEntry failed:', {
            function: 'saveStepsEntry',
            date: entry.date,
            error: result.error.message,
            userId: supabase?.user?.id
          });
          throw new Error(result.error.message);
        }

        console.log('[Biometrics] saveStepsEntry successful:', entry.date);
        return result;
      } catch (err) {
        console.error('[Biometrics] saveStepsEntry FAILED:', {
          function: 'saveStepsEntry',
          date: entry.date,
          error: err.message,
          stack: err.stack,
          userId: supabase?.user?.id
        });
        throw err;
      }
    }
  };

  const saveOuraLog = async (newLog) => {
    setOuraLog(newLog);
    try {
      await storage.set('lucas-oura-log-v5', JSON.stringify(newLog));
    } catch (err) {
      console.error('Error saving oura log: ', err);
    }
  };

  const saveOuraEntry = async (entry) => {
    if (useCloud) {
      try {
        const result = await supabase.saveOura(entry);

        // Validar que el save fue exitoso
        if (result?.error) {
          console.error('[Biometrics] saveOuraEntry failed:', {
            function: 'saveOuraEntry',
            date: entry.date,
            error: result.error.message,
            userId: supabase?.user?.id
          });
          throw new Error(result.error.message);
        }

        console.log('[Biometrics] saveOuraEntry successful:', entry.date);
        return result;
      } catch (err) {
        // CRITICAL: Log error with full context
        console.error('[Biometrics] saveOuraEntry FAILED:', {
          function: 'saveOuraEntry',
          date: entry.date,
          error: err.message,
          stack: err.stack,
          userId: supabase?.user?.id
        });

        // Propagate error for UI feedback
        throw err;
      }
    }
  };

  return {
    profile, setProfile, saveProfile,
    customTargets, setCustomTargets, saveTargets,
    weightHistory, setWeightHistory, saveWeightHistory, saveWeightEntry, getMostRecentWeight,
    stepsLog, setStepsLog, saveStepsLog, saveStepsEntry,
    ouraLog, setOuraLog, saveOuraLog, saveOuraEntry
  };
};
