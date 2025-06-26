import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import i18n from '../i18n';

// Map of language names to i18n codes
const LANGUAGE_CODES = {
  "English": "en",
  "Hindi": "hi", 
  "Marathi": "mr", 
  "Bengali": "bn", 
  "Tamil": "ta", 
  "Telugu": "te", 
  "Gujarati": "gu", 
  "Kannada": "kn"
};

// List of supported languages
export const languages = Object.keys(LANGUAGE_CODES);

// Create language context
export const LanguageContext = createContext({
  selectedLanguage: "English",
  changeLanguage: (language: string) => {},
  languages: languages,
  languageCode: "en"
});

// Custom hook to use language context
export const useLanguage = () => {
  return useContext(LanguageContext);
};

// Language provider component
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  // Try to get saved language from localStorage, default to English
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('indiclaw-language');
    return languages.includes(savedLanguage || "") ? savedLanguage : "English";
  });

  // Memoize the language code
  const languageCode = useMemo(() => 
    LANGUAGE_CODES[selectedLanguage as keyof typeof LANGUAGE_CODES] || 'en', 
    [selectedLanguage]
  );

  // Set initial language when component mounts
  useEffect(() => {
    i18n.changeLanguage(languageCode);
  }, []);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('indiclaw-language', selectedLanguage || "English");
    
    // Update i18next language when selectedLanguage changes
    i18n.changeLanguage(languageCode);
  }, [selectedLanguage, languageCode]);

  // Change language function (memoized)
  const changeLanguage = useCallback((language: string) => {
    if (languages.includes(language)) {
      setSelectedLanguage(language);
    }
  }, []);

  // Memoize context value to prevent unnecessary rerenders
  const value = useMemo(() => ({
    selectedLanguage,
    changeLanguage,
    languages,
    languageCode
  }), [selectedLanguage, changeLanguage, languageCode]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
