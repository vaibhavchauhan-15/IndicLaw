import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import IndicLawLandingPage from "./components/IndicLawLandingPage";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import "./App.css";
import "./styles/formattedContent.css";
import "./i18n"; // Import i18n configuration

const queryClient = new QueryClient();

// User activity tracker component
const ActivityMonitor = () => {
  useEffect(() => {
    // Update last activity timestamp on user interaction
    const updateActivity = () => {
      const user = localStorage.getItem('authToken');
      if (user) {
        localStorage.setItem('lastActivity', Date.now().toString());
      }
    };

    // Add event listeners for various user activities
    window.addEventListener('click', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('scroll', updateActivity);
    window.addEventListener('mousemove', updateActivity);

    // Initial activity timestamp
    updateActivity();

    return () => {
      // Clean up event listeners
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('scroll', updateActivity);
      window.removeEventListener('mousemove', updateActivity);
    };
  }, []);

  return null; // This component doesn't render anything
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ActivityMonitor />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<IndicLawLandingPage />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/chatbot" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
              
              {/* Auth Routes - Redirect if already authenticated */}
              <Route element={<AuthRedirect />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
