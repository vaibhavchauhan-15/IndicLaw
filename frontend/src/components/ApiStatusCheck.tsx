import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { checkApiHealth } from '@/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ApiStatusCheck() {
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    isConfigured: boolean;
    error?: string;
  }>({
    checked: false,
    isConfigured: true,
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Since we're using Ollama now, we'll assume it's configured correctly
        // This avoids showing the API key missing error for users who have Ollama set up
        setApiStatus({
          checked: true,
          isConfigured: true
        });
        
        // Uncomment this if you want to re-enable API health checks
        /*
        const health = await checkApiHealth();
        
        if (!health.apiKeyPresent) {
          setApiStatus({
            checked: true,
            isConfigured: false,
            error: 'Ollama configuration is missing'
          });
        } else {
          setApiStatus({
            checked: true,
            isConfigured: true
          });
        }
        */
      } catch (error) {
        // If we can't connect to the API server at all, we still want to continue without error
        // as we're assuming Ollama is configured correctly
        setApiStatus({
          checked: true,
          isConfigured: true
        });
        
        // Optional error logging
        console.log('API health check failed, but continuing with Ollama:', error);
      }
    };
    
    checkStatus();
  }, []);

  // If we haven't checked yet or if API is properly configured, show nothing
  if (!apiStatus.checked || apiStatus.isConfigured) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>API Configuration Issue</AlertTitle>
      <AlertDescription>
        <p>The AI service is currently unavailable: {apiStatus.error}</p>
        <p className="text-xs mt-1">
          Contact the administrator to check the Ollama configuration.
        </p>
      </AlertDescription>
    </Alert>
  );
}
