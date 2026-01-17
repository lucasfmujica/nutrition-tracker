import { storage } from './storage';

export const CACHE_KEYS = {
  PROFILE: 'lucas-profile-v5',
  WEIGHT: 'lucas-weight-history-v5',
  FOOD: 'lucas-food-log-v5',
  WORKOUT: 'lucas-workout-log-v5',
  STEPS: 'lucas-steps-log-v5',
  TARGETS: 'lucas-targets-v5',
  OURA: 'lucas-oura-log-v5',
  WATER: 'lucas-water-log-v5'
};

const safeParse = (item, defaultValue) => {
  if (!item?.value) return defaultValue;
  try {
    return JSON.parse(item.value);
  } catch (e) {
    console.warn('Error parsing cached item:', e);
    return defaultValue;
  }
};

export const loadCachedData = async () => {
  const [
    profileData,
    weightData,
    foodData,
    workoutData,
    stepsData,
    targetsData,
    ouraData,
    waterData
  ] = await Promise.all([
    storage.get(CACHE_KEYS.PROFILE).catch(() => null),
    storage.get(CACHE_KEYS.WEIGHT).catch(() => null),
    storage.get(CACHE_KEYS.FOOD).catch(() => null),
    storage.get(CACHE_KEYS.WORKOUT).catch(() => null),
    storage.get(CACHE_KEYS.STEPS).catch(() => null),
    storage.get(CACHE_KEYS.TARGETS).catch(() => null),
    storage.get(CACHE_KEYS.OURA).catch(() => null),
    storage.get(CACHE_KEYS.WATER).catch(() => null)
  ]);

  return {
    localProfile: safeParse(profileData, null),
    localWeight: safeParse(weightData, []),
    localFood: safeParse(foodData, []),
    localWorkout: safeParse(workoutData, []),
    localSteps: safeParse(stepsData, []),
    localTargets: safeParse(targetsData, null),
    localOura: safeParse(ouraData, []),
    localWater: safeParse(waterData, [])
  };
};

export const cacheData = async (data) => {
  try {
    const promises = [];
    if (data.profile) promises.push(storage.set(CACHE_KEYS.PROFILE, JSON.stringify(data.profile)));
    if (data.targets) promises.push(storage.set(CACHE_KEYS.TARGETS, JSON.stringify(data.targets)));
    if (data.weightHistory?.length > 0) promises.push(storage.set(CACHE_KEYS.WEIGHT, JSON.stringify(data.weightHistory)));
    if (data.foodLog?.length > 0) promises.push(storage.set(CACHE_KEYS.FOOD, JSON.stringify(data.foodLog)));
    if (data.workouts?.length > 0) promises.push(storage.set(CACHE_KEYS.WORKOUT, JSON.stringify(data.workouts)));
    if (data.stepsLog?.length > 0) promises.push(storage.set(CACHE_KEYS.STEPS, JSON.stringify(data.stepsLog)));
    if (data.ouraLog?.length > 0) promises.push(storage.set(CACHE_KEYS.OURA, JSON.stringify(data.ouraLog)));
    if (data.waterLog?.length > 0) promises.push(storage.set(CACHE_KEYS.WATER, JSON.stringify(data.waterLog)));

    await Promise.all(promises);
    return true;
  } catch (err) {
    console.warn('[Data] Failed to cache data:', err);
    return false;
  }
};

export const clearCache = async () => {
  const keys = Object.values(CACHE_KEYS);
  for (const key of keys) {
    await storage.remove(key);
  }
};
