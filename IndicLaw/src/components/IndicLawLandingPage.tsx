import React, { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import LanguageSelector from "./LanguageSelector";
import AnimatedButton from "./AnimatedButton";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { LogOut, User, MessageSquare, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import "@/styles/neuButton.css";
import "@/styles/pulseWave.css";
import { setupPulseWave } from "@/lib/pulseWave";

// NeuButton component for the new style
const NeuButton = memo(({ 
  to, 
  text, 
  onClick, 
  className = "", 
  size = "default" 
}: { 
  to: string, 
  text: string, 
  onClick?: () => void, 
  className?: string,
  size?: "default" | "large"
}) => (
  <Link 
    to={to} 
    className={`neu-button ${size === "large" ? "neu-button-lg" : ""} ${className}`} 
    onClick={onClick ? (e) => { e.preventDefault(); onClick(); } : undefined}
  >
    {text}
  </Link>
));

// Memoized sub-components
const NavLink = memo(({ href, onClick, children }: { href: string, onClick?: () => void, children: React.ReactNode }) => (
  <a href={href} className="nav-link hover:text-link-hover transition-colors duration-300 font-medium" onClick={onClick}>
    {children}
  </a>
));

const StatsItem = memo(({ value, label, delay }: { value: string, label: string, delay?: string }) => (
  <div className="text-center hero-animation-element" style={delay ? {animationDelay: delay} : undefined}>
    <p className="text-3xl font-bold text-primary-text">{value}</p>
    <p className="text-secondary-text">{label}</p>
  </div>
));

const FeatureCard = memo(({ emoji, title, description }: { emoji: string, title: string, description: string }) => (
  <div className="p-8 rounded-2xl border border-gray-300 shadow-lg feature-card bg-white">
    <div className="mb-6 p-4 rounded-full w-16 h-16 flex items-center justify-center border-2 border-gray-300 bg-secondary-bg">
      <span className="text-2xl">{emoji}</span>
    </div>
    <h3 className="text-2xl font-semibold mb-4 text-primary-text">{title}</h3>
    <p className="text-secondary-text">{description}</p>
  </div>
));

const StepItem = memo(({ number, title, description, delay }: { number: string, title: string, description: string, delay?: string }) => (
  <div className="relative hero-animation-element" style={delay ? {animationDelay: delay} : undefined}>
    <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-button-bg text-white font-bold text-xl flex items-center justify-center">
      {number}
    </div>
    <div className="border border-gray-300 rounded-2xl p-8 pt-12 bg-white shadow-lg">
      <h3 className="text-2xl font-semibold mb-4 text-primary-text">{title}</h3>
      <p className="text-secondary-text">{description}</p>
    </div>
  </div>
));

function IndicLawLandingPage() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const pulseWaveContainerRef = useRef<HTMLDivElement>(null);

  // Pulse wave animation setup
  useEffect(() => {
    let cleanupFunction: (() => void) | undefined;
    
    if (pulseWaveContainerRef.current) {
      cleanupFunction = setupPulseWave(pulseWaveContainerRef.current, {
        dotColor: "100, 100, 255", // Slightly blue dots for better visibility in light theme
        intensity: 1.2
      });
    }
    
    return () => {
      if (cleanupFunction) {
        cleanupFunction();
      }
    };
  }, []);

  // Handle scrolling effects - memoized scroll handler
  const handleScroll = useCallback(() => {
    const isScrolled = window.scrollY > 10;
    if (isScrolled !== scrolled) {
      setScrolled(isScrolled);
    }
  }, [scrolled]);
  
  useEffect(() => {
    document.addEventListener("scroll", handleScroll);
    return () => {
      document.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);
  
  // Memoized menu toggle handler
  const toggleMobileMenu = useCallback(() => {
    setShowMobileMenu(prevState => !prevState);
  }, []);
  
  // Memoized menu closer
  const closeMobileMenu = useCallback(() => {
    setShowMobileMenu(false);
  }, []);

  // Memoized header class
  const headerClass = useMemo(() => (
    `sticky top-0 z-50 backdrop-filter backdrop-blur-lg bg-white bg-opacity-95 shadow-lg transition-all duration-300 ${scrolled ? 'border-b border-gray-200' : ''}`
  ), [scrolled]);
  
  // Memoized mobile menu class
  const mobileMenuClass = useMemo(() => (
    `mobile-menu md:hidden ${showMobileMenu ? 'visible' : 'hidden'} border-t border-gray-200 bg-white shadow-lg rounded-b-xl`
  ), [showMobileMenu]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      navigate('/');
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: "An error occurred while logging out",
      });
    }
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!currentUser?.displayName) return "U";
    return currentUser.displayName
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="font-sans min-h-screen flex flex-col">
      {/* Header with improved navigation */}
      <header className={headerClass}>
        <div className="container mx-auto flex justify-between items-center py-3 px-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold mr-2">⚖️</span>
            <span className="relative text-xl font-bold tracking-wider logo-text text-black">
              INDICLAW AI
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex items-center space-x-6">
              {/* Language Selector */}
              <LanguageSelector isDarkTheme={false} />
              
              {/* Authentication Links or User Profile */}
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={currentUser.photoURL || ""} />
                        <AvatarFallback className="bg-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {currentUser.displayName && (
                          <p className="font-medium">{currentUser.displayName}</p>
                        )}
                        <p className="text-sm text-muted-foreground truncate w-40">
                          {currentUser.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/chatbot" className="w-full cursor-pointer">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        <span>Chatbot</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-red-600 cursor-pointer focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login" className="text-primary hover:text-primary/80 font-medium">
                  Login
                </Link>
              )}
            </nav>
            
            {/* Language Selector for Mobile - Visible only on medium and smaller screens */}
            <div className="md:hidden">
              <LanguageSelector isDarkTheme={false} iconOnly={true} />
            </div>
            
            <NeuButton 
              to={currentUser ? "/chatbot" : "/login"} 
              text={t('navbar.getStarted')}
              className="ml-2 navbar-get-started"
            />
          
            {/* Mobile menu button - hidden on desktop */}
            <button 
              className="md:hidden btn-16 hover:text-black p-1 rounded-full border border-gray-300 shadow-sm"
              onClick={toggleMobileMenu}
            >
              <svg className="w-5 h-5" fill="none" stroke="black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={mobileMenuClass}>
          <div className="container mx-auto p-4">
            <nav className="flex flex-col space-y-4">
              <div className="pt-2">
                <NeuButton 
                  to={currentUser ? "/chatbot" : "/login"}
                  text={t('navbar.getStarted')}
                  onClick={closeMobileMenu}
                  className="w-full flex justify-center navbar-get-started"
                />
              </div>
              {currentUser ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center gap-3 p-3 border rounded-md">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={currentUser.photoURL || ""} />
                      <AvatarFallback className="bg-primary text-white">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      {currentUser.displayName && (
                        <p className="font-medium">{currentUser.displayName}</p>
                      )}
                      <p className="text-sm text-muted-foreground truncate w-40">
                        {currentUser.email}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to="/profile" 
                    className="w-full py-2 block text-center text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <UserCircle className="mr-2 h-4 w-4 inline-block" />
                    Profile
                  </Link>
                  <Link 
                    to="/chatbot" 
                    className="w-full py-2 block text-center text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    <MessageSquare className="mr-2 h-4 w-4 inline-block" />
                    Chatbot
                  </Link>
                  <Button 
                    variant="outline"
                    className="w-full py-2 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Link 
                    to="/login" 
                    className="w-full py-2 block text-center text-primary border border-primary rounded-md hover:bg-primary/10 transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section with improved layout */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-8">
                <h1 className="text-5xl font-bold leading-tight hero-animation-element text-primary-text">
                  <span className="block mb-2">{t('hero.title')}</span>
                  <span className="block text-secondary-text">{t('hero.subtitle')}</span>
                </h1>
                <p className="text-xl text-secondary-text hero-animation-element" style={{animationDelay: "0.2s"}}>
                  {t('hero.description')}
                </p>
                <div className="flex flex-wrap gap-5 hero-animation-element" style={{animationDelay: "0.4s"}}>
                  <NeuButton 
                    to="/chatbot" 
                    text={t('hero.askQuestion')}
                    size="large"
                  />
                  <AnimatedButton 
                    href="#how-it-works" 
                    text={t('hero.learnMore')}
                    variant="dark"
                  />
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative h-96 w-full rounded-2xl border-2 border-primary/40 overflow-hidden shadow-2xl shine bg-gradient-to-br from-white to-blue-50">
                  {/* Enhanced justice image representation with pulse wave */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Decorative floating elements */}
                    <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 opacity-50 animate-float"></div>
                    <div className="absolute bottom-12 left-12 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 opacity-60 animate-float-delay"></div>
                    <div className="absolute top-1/3 left-10 w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 opacity-40 animate-float-slow"></div>
                    
                    {/* Glow effect behind the scales */}
                    <div className="absolute w-64 h-64 bg-blue-200/30 rounded-full blur-xl"></div>
                    
                    {/* Main pulse wave container with enhanced styling */}
                    <div ref={pulseWaveContainerRef} className="w-52 h-52 rounded-full flex items-center justify-center pulse-wave-container z-10">
                      {/* Inner circles with improved styling */}
                      <div className="w-40 h-40 rounded-full border-4 border-primary/30 flex items-center justify-center bg-gradient-to-br from-white to-blue-50 shadow-inner emoji-container">
                        <div className="w-32 h-32 rounded-full border-2 border-primary/20 flex items-center justify-center bg-white shadow-lg">
                          {/* Scales emoji with enhanced styling */}
                          <div className="bg-gradient-to-br from-amber-50 to-amber-100 w-24 h-24 rounded-full flex items-center justify-center">
                            <span className="text-6xl relative z-10 animate-pulse-slow">⚖️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Light beams radiating outward */}
                  <div className="absolute inset-0 opacity-20 overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 w-[150%] h-8 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                    <div className="absolute top-1/2 left-1/2 w-[150%] h-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="scroll-indicator">
            <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-t border-b border-gray-300 bg-secondary-bg">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <StatsItem value="10+" label={t('stats.languages')} />
              <StatsItem value="1000+" label={t('stats.questionsAnswered')} delay="0.2s" />
              <StatsItem value="24/7" label={t('stats.availability')} delay="0.4s" />
              <StatsItem value="100%" label={t('stats.freeAccess')} delay="0.6s" />
            </div>
          </div>
        </section>

        {/* Features with improved cards */}
        <section id="features" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-primary-text">{t('features.title')}</h2>
              <p className="text-xl text-secondary-text max-w-2xl mx-auto">
                {t('features.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                emoji="🗣️"
                title={t('features.multilingualChatbot.title')}
                description={t('features.multilingualChatbot.description')}
              />
              <FeatureCard 
                emoji="📄"
                title={t('features.documentSummary.title')}
                description={t('features.documentSummary.description')}
              />
              <FeatureCard 
                emoji="👨‍⚖️"
                title={t('features.nearbyAdvocates.title')}
                description={t('features.nearbyAdvocates.description')}
              />
            </div>
          </div>
        </section>

        {/* How It Works section */}
        <section id="how-it-works" className="py-20 px-4 bg-tertiary-bg">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4 text-primary-text">{t('howItWorks.title')}</h2>
              <p className="text-xl text-secondary-text max-w-2xl mx-auto">
                {t('howItWorks.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <StepItem 
                number="1"
                title={t('howItWorks.steps.step1.title')} 
                description={t('howItWorks.steps.step1.description')}
              />
              <StepItem 
                number="2"
                title={t('howItWorks.steps.step2.title')} 
                description={t('howItWorks.steps.step2.description')}
                delay="0.2s"
              />
              <StepItem 
                number="3"
                title={t('howItWorks.steps.step3.title')} 
                description={t('howItWorks.steps.step3.description')}
                delay="0.4s"
              />
            </div>
          </div>
        </section>

        {/* CTA Section with improved design */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center border border-gray-300 rounded-3xl p-12 bg-secondary-bg shadow-2xl shine">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('cta.title')}</h2>
              <p className="text-xl mb-8">
                {t('cta.subtitle')}
              </p>
              <NeuButton 
                to="/chatbot" 
                text={t('cta.button')}
                size="large"
                className="mx-auto" 
              />
            </div>
          </div>
        </section>

        {/* About Us with team */}
        <section id="about" className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{t('about.title')}</h2>
              <p className="text-xl max-w-3xl mx-auto">
                {t('about.subtitle')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="hero-animation-element">
                <h3 className="text-2xl font-semibold mb-6">{t('about.vision.title')}</h3>
                <p className="mb-6">
                  {t('about.vision.description1')}
                </p>
                <p>
                  {t('about.vision.description2')}
                </p>
              </div>
              <div className="hero-animation-element" style={{animationDelay: "0.3s"}}>
                <h3 className="text-2xl font-semibold mb-6">{t('about.technology.title')}</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="mr-3 mt-1">✓</span>
                    <span>{t('about.technology.point1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1">✓</span>
                    <span>{t('about.technology.point2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1">✓</span>
                    <span>{t('about.technology.point3')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-3 mt-1">✓</span>
                    <span>{t('about.technology.point4')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer with improved design */}
      <footer className="bg-secondary-bg border-t border-gray-300 py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">IndicLaw AI</h3>
              <p>
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="hover:text-link-hover transition-colors duration-300">{t('navbar.features')}</a></li>
                <li><a href="#how-it-works" className="hover:text-link-hover transition-colors duration-300">{t('navbar.howItWorks')}</a></li>
                <li><a href="#about" className="hover:text-link-hover transition-colors duration-300">{t('navbar.aboutUs')}</a></li>
                <li><Link to="/chatbot" className="hover:text-link-hover transition-colors duration-300">{t('chatbot.title')}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.languages')}</h4>
              <ul className="space-y-2">
                <li>Hindi</li>
                <li>Marathi</li>
                <li>Bengali</li>
                <li>Tamil</li>
                <li>+ 6 more</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
              <ul className="space-y-2">
                <li>support@indiclaw.ai</li>
                <li>+91 9988776655</li>
                <li>Bengaluru, India</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-300 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-link-hover transition-colors duration-300">
                <span className="sr-only">Twitter</span>
                <span className="text-lg">𝕏</span>
              </a>
              <a href="#" className="hover:text-link-hover transition-colors duration-300">
                <span className="sr-only">LinkedIn</span>
                <span className="text-lg">in</span>
              </a>
              <a href="#" className="hover:text-link-hover transition-colors duration-300">
                <span className="sr-only">Instagram</span>
                <span className="text-lg">📷</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default memo(IndicLawLandingPage);
