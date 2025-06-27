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

// Reverse map for convenience
const CODE_TO_LANGUAGE: Record<string, string> = {};
Object.entries(LANGUAGE_CODES).forEach(([lang, code]) => {
  CODE_TO_LANGUAGE[code] = lang;
});

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
  // Try to get saved language from localStorage or sync with i18n's current language
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    try {
      // First try to get from localStorage
      const savedLanguage = localStorage.getItem('indiclaw-language');
      if (savedLanguage && languages.includes(savedLanguage)) {
        return savedLanguage;
      }
      
      // If not found in localStorage, check current i18n language
      const currentI18nCode = i18n.language;
      if (currentI18nCode && CODE_TO_LANGUAGE[currentI18nCode]) {
        return CODE_TO_LANGUAGE[currentI18nCode];
      }
      
      // Default to English if nothing found
      return "English";
    } catch (error) {
      console.error("Error accessing localStorage:", error);
      return "English";
    }
  });

  // Memoize the language code
  const languageCode = useMemo(() => 
    LANGUAGE_CODES[selectedLanguage as keyof typeof LANGUAGE_CODES] || 'en', 
    [selectedLanguage]
  );

  // Sync with i18n on mount and when language changes
  useEffect(() => {
    console.log(`Synchronizing language: ${selectedLanguage} (${languageCode})`);
    
    // Update i18next directly
    i18n.changeLanguage(languageCode).then(() => {
      console.log(`i18n language synced to: ${languageCode}`);
    }).catch(error => {
      console.error(`Error syncing i18n language to ${languageCode}:`, error);
    });
    
    // Save to localStorage
    try {
      localStorage.setItem('indiclaw-language', selectedLanguage);
    } catch (error) {
      console.error("Error saving language to localStorage:", error);
    }
  }, [selectedLanguage, languageCode]);
  
  // Keep an eye on i18n language changes from outside this component
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const matchedLanguage = CODE_TO_LANGUAGE[lng];
      if (matchedLanguage && matchedLanguage !== selectedLanguage) {
        console.log(`External language change detected: ${lng} -> ${matchedLanguage}`);
        setSelectedLanguage(matchedLanguage);
      }
    };
    
    // Add listener for language changes
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      // Clean up listener
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [selectedLanguage]);

  // Change language function (memoized)
  const changeLanguage = useCallback((language: string) => {
    if (languages.includes(language)) {
      console.log(`Changing language to: ${language}`);
      
      // Update the state which will trigger the effect above
      setSelectedLanguage(language);
    } else {
      console.warn(`Attempted to change to unsupported language: ${language}`);
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
