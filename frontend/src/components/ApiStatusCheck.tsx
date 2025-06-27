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
        const health = await checkApiHealth();
        
        // Only show alerts if there's no API key at all
        // This avoids showing false error messages when the API key exists but there are temporary connection issues
        if (!health.apiKeyPresent) {
          setApiStatus({
            checked: true,
            isConfigured: false,
            error: 'API key is missing'
          });
        } else {
          setApiStatus({
            checked: true,
            isConfigured: true
          });
        }
      } catch (error) {
        // If we can't connect to the API server at all, show an error
        // This is a different issue than having a valid API key
        setApiStatus({
          checked: true,
          isConfigured: false,
          error: 'Could not connect to API server'
        });
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
          Contact the administrator to check the API key configuration.
        </p>
      </AlertDescription>
    </Alert>
  );
}
