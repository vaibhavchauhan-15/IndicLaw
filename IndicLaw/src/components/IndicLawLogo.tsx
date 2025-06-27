import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/**
 * INDICLAW AI Logo Component
 */
export const IndicLawLogo: React.FC<LogoProps> = ({ size = 'medium', className = '' }) => {
  // Size mapping
  const sizeMap = {
    small: 'h-8',
    medium: 'h-10',
    large: 'h-14'
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`relative ${sizeMap[size]} aspect-square bg-primary rounded-lg overflow-hidden flex items-center justify-center`}>
        <span className="text-primary-foreground font-bold text-xl z-10">⚖️</span>
        {/* Animated glow effect - more muted colors */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500 to-slate-700 opacity-75 animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight leading-none ${className.includes('text-white') ? 'text-white' : 'text-foreground'}`}>
          <span className={className.includes('text-white') ? 'text-white' : 'text-slate-800'}>INDIC</span>
          <span className={className.includes('text-white') ? 'text-white' : 'text-slate-900'}>LAW</span>
        </span>
        <span className={`text-xs font-medium tracking-wide ${className.includes('text-white') ? 'text-gray-200' : 'text-slate-700'}`}>
          AI Assistant
        </span>
      </div>
    </div>
  );
};
