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

// Try to get initial language from localStorage
const getInitialLanguage = () => {
  try {
    const savedLanguage = localStorage.getItem('indiclaw-language');
    if (savedLanguage) {
      const langCode = {
        "English": "en",
        "Hindi": "hi",
        "Marathi": "mr",
        "Bengali": "bn",
        "Tamil": "ta",
        "Telugu": "te",
        "Gujarati": "gu",
        "Kannada": "kn"
      }[savedLanguage];
      
      if (langCode) {
        console.log(`Using saved language from localStorage: ${savedLanguage} (${langCode})`);
        return langCode;
      }
    }
  } catch (error) {
    console.error("Error reading language from localStorage:", error);
  }
  
  return undefined; // Let language detector decide
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    lng: getInitialLanguage(), // Set initial language if available
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    react: {
      useSuspense: false, // prevents issues with SSR
    },
  });

// Log initialization
console.log(`i18n initialized with language: ${i18n.language}`);

export default i18n;
