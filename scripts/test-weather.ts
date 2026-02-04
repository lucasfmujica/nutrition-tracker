// scripts/test-weather.ts

// Mock browser environment before imports
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        },
    };
})();

// Define globals
Object.defineProperty(global, 'localStorage', { value: localStorageMock });
Object.defineProperty(global, 'window', {
    value: { localStorage: localStorageMock },
});

// Import service after mocking
import { getDailyWeather } from '../src/services/weatherService';

// Run tests
const runTests = async () => {
    console.log('--- Testing Weather Service ---');

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    // 1. Test Today (Forecast) - English (Imperial/NYC default logic if applied, or depends on service)
    console.log(`\n1. Testing Today (${today}) - EN...`);
    try {
        const res = await getDailyWeather(today, 'en');
        console.log('Result:', res);
        if (res && res.maxTemp !== undefined) {
            console.log('✅ Success');
        } else {
            console.log('❌ Failed: Missing maxTemp');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    }

    // 2. Test Yesterday (Past/Archive) - Spanish (Metric/BA default logic)
    console.log(`\n2. Testing Yesterday (${yesterday}) - ES...`);
    try {
        const res = await getDailyWeather(yesterday, 'es');
        console.log('Result:', res);
        if (res && res.maxTemp !== undefined) {
            console.log('✅ Success');
        } else {
            console.log('❌ Failed: Missing maxTemp');
        }
    } catch (err) {
        console.error('❌ Error:', err);
    }
};

runTests();
