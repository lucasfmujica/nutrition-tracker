import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import es from './locales/es.json';

i18n.use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            es: { translation: es },
            en: { translation: en },
        },
        fallbackLng: 'es',
        lng: 'es', // Default initial language
        detection: {
            order: ['localStorage', 'navigator'],
            caches: ['localStorage'],
        },
        interpolation: {
            escapeValue: false, // React already safes from xss
        },
    });

export default i18n;
