import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  isDarkTheme?: boolean;
  iconOnly?: boolean;
}

// A reusable language selector component
const LanguageSelector = ({ isDarkTheme = false, iconOnly = false }: LanguageSelectorProps) => {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const { selectedLanguage, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  // Close language dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showLanguageMenu && !target.closest('.language-selector')) {
        setShowLanguageMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageMenu]);

  // Styles based on theme
  const dropdownStyles = isDarkTheme 
    ? "bg-secondary-bg border-gray-700"
    : "bg-white border-gray-200";
  
  const hoverStyles = isDarkTheme
    ? "hover:bg-tertiary-bg"
    : "hover:bg-gray-100";

  const textHoverStyles = isDarkTheme
    ? "hover:text-white"
    : "hover:text-gray-800";

  return (
    <div className="language-selector relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setShowLanguageMenu(!showLanguageMenu);
        }}
        className={`flex items-center ${textHoverStyles} transition-colors duration-300`}
        title={iconOnly ? `${t('language.change')} (${selectedLanguage})` : undefined}
      >
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129">
          </path>
        </svg>
        {!iconOnly && selectedLanguage}
        {!iconOnly && (
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"></path>
          </svg>
        )}
      </button>
      
      {/* Language Dropdown */}
      {showLanguageMenu && (
        <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${dropdownStyles} border z-50`}>
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang}
                className={`block w-full text-left px-4 py-2 ${hoverStyles} ${selectedLanguage === lang ? 'font-semibold' : ''}`}
                onClick={() => {
                  changeLanguage(lang);
                  setShowLanguageMenu(false);
                }}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
