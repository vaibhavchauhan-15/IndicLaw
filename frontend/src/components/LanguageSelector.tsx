import React, { useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';

interface LanguageSelectorProps {
  className?: string;
  showIcon?: boolean;
  isDarkTheme?: boolean;
  iconOnly?: boolean;
}

// A reusable language selector component
const LanguageSelector = ({ 
  className = '', 
  showIcon = false,
  isDarkTheme = false,
  iconOnly = false
}: LanguageSelectorProps) => {
  const { selectedLanguage, changeLanguage, languages } = useLanguage();
  const { t } = useTranslation();

  // Log when the component renders with its props
  useEffect(() => {
    console.log(`LanguageSelector rendered: isDarkTheme=${isDarkTheme}, iconOnly=${iconOnly}`);
    console.log(`Current language: ${selectedLanguage}`);
  }, [selectedLanguage, isDarkTheme, iconOnly]);

  const handleLanguageChange = (lang: string) => {
    console.log(`Language selection clicked: ${lang}`);
    changeLanguage(lang);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex items-center gap-1.5 px-1 ${isDarkTheme ? 'text-white hover:bg-white/10' : 'hover:bg-gray-100'} ${className}`}
        >
          {(showIcon || iconOnly) && <Globe className={`w-4 h-4 ${isDarkTheme ? 'text-white' : ''}`} />}
          {!iconOnly && (
            <span className={isDarkTheme ? 'text-white' : ''}>{t("language.current")}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem 
            key={lang} 
            onClick={() => handleLanguageChange(lang)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span>{t(lang)}</span>
            {selectedLanguage === lang && <Check className="w-4 h-4 ml-1" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
