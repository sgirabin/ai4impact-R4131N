// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: ['en', 'id', 'hi'], // Multiple fallback languages
    debug: process.env.NODE_ENV === 'development',
    backend: {
      loadPath: '/locales/{{lng}}.json', // Ensure this path is correct
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
