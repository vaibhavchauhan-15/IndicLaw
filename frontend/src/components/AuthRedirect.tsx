import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface AuthRedirectProps {
  children?: React.ReactNode;
}

const AuthRedirect: React.FC<AuthRedirectProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);
  const [redirected, setRedirected] = useState(false);
  
  // Only show loading spinner after a brief delay to prevent flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoading(true);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [loading]);
  
  // Get the redirect path from location state or default to chatbot
  const from = location.state?.from?.pathname || '/chatbot';

  if (loading) {
    if (showLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-slate-500 mt-4">Checking authentication status...</p>
        </div>
      );
    }
    return null; // Don't show anything for a brief moment to prevent flash
  }

  // If user is already authenticated, redirect
  if (currentUser && !redirected) {
    console.log("User is authenticated, redirecting to:", from);
    setRedirected(true); // Prevent infinite redirects
    return <Navigate to={from} replace />;
  }

  // If there are children, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default AuthRedirect;
