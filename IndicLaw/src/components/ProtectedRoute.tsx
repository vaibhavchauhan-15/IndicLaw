import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading, userProfile } = useAuth();
  const location = useLocation();
  const [showLoading, setShowLoading] = useState(false);

  // Only show loading spinner after a brief delay to prevent flicker
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        setShowLoading(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    if (showLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-slate-50 to-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="text-sm text-slate-500 mt-4">Loading your profile...</p>
        </div>
      );
    }
    return null; // Don't show anything for a brief moment to prevent flash
  }

  if (!currentUser) {
    console.log('User not authenticated, redirecting to login');
    // Redirect to login but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Optional: Check if user profile is complete
  // You can use this to redirect users to complete their profile if needed
  /*
  if (currentUser && userProfile && !userProfile.isProfileComplete) {
    return <Navigate to="/complete-profile" state={{ from: location }} replace />;
  }
  */

  // If there are children, render them, otherwise render the Outlet
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;
