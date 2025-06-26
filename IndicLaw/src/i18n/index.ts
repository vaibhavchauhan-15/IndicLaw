import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import translationEN from './locales/en.json';
import translationHI from './locales/hi.json';
import translationMR from './locales/mr.json';
import translationBN from './locales/bn.json';
import translationTA from './locales/ta.json';
import translationTE from './locales/te.json';
import translationGU from './locales/gu.json';
import translationKN from './locales/kn.json';

// the translations
const resources = {
  en: {
    translation: translationEN
  },
  hi: {
    translation: translationHI
  },
  mr: {
    translation: translationMR
  },
  bn: {
    translation: translationBN
  },
  ta: {
    translation: translationTA
  },
  te: {
    translation: translationTE
  },
  gu: {
    translation: translationGU
  },
  kn: {
    translation: translationKN
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false, // prevents issues with SSR
    },
  });

export default i18n;
