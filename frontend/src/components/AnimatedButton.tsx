import React from 'react';
import { Link } from 'react-router-dom';

interface AnimatedButtonProps {
  text: string;
  to?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'light' | 'dark';
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  text, 
  to, 
  href, 
  onClick,
  className = "",
  variant = 'default'
}) => {
  // Determine colors based on variant
  const getVariantClasses = (variant: string) => {
    switch(variant) {
      case 'light':
        return 'text-white border border-white/50 hover:bg-white hover:text-blue-800';
      case 'dark':
        return 'text-gray-800 border border-gray-300 hover:bg-gray-800 hover:text-white';
      default:
        return 'text-blue-600 border border-blue-400 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white hover:border-transparent hover:-translate-y-0.5';
    }
  };

  const variantClasses = getVariantClasses(variant);
  
  const buttonContent = (
    <span className="relative z-[1] transition-all duration-300 ease-custom">{text}</span>
  );

  const buttonClasses = `animated-button relative flex items-center justify-center py-1.5 px-5 text-sm bg-transparent rounded-full font-medium transition-all duration-300 ease-custom hover:shadow-md active:scale-95 ${variantClasses} ${className}`;

  if (to) {
    return (
      <Link to={to} className={buttonClasses}>
        {buttonContent}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={buttonClasses} onClick={onClick}>
        {buttonContent}
      </a>
    );
  }

  return (
    <button className={buttonClasses} onClick={onClick}>
      {buttonContent}
    </button>
  );
};

export default AnimatedButton;
