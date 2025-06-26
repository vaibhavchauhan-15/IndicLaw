import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, googleSignIn, resetPassword, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Get redirect path from location state or default to /chatbot
  const from = location.state?.from?.pathname || '/chatbot';

  // Load remembered email from localStorage if available
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Form validation schema
  const formSchema = z.object({
    email: z.string().email({
      message: t('login.validation.email'),
    }),
    password: z.string().min(6, {
      message: t('login.validation.password'),
    }),
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Handle login submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("Attempting login for:", values.email);
      await login(values.email, values.password);
      
      // Store login timestamp in localStorage for session tracking (optional)
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      
      // Store "remember me" preference
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', values.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      console.log("Login successful, navigating to:", from);
      navigate(from, { replace: true });
      
      toast({
        title: t('login.success'),
        description: t('login.welcome'),
      });
    } catch (err: any) {
      console.error("Login error:", err);
      
      // Display specific error messages based on the error code
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        toast({
          variant: "destructive",
          title: t('login.error'),
          description: t('login.invalidCredentials'),
        });
      } else if (err.code === 'auth/too-many-requests') {
        toast({
          variant: "destructive",
          title: t('login.error'),
          description: t('login.tooManyAttempts'),
        });
      } else {
        toast({
          variant: "destructive",
          title: t('login.error'),
          description: error || t('login.genericError'),
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Google sign-in
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await googleSignIn();
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        variant: "destructive",
        title: t('login.error'),
        description: error || t('login.googleError'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: t('login.resetError'),
        description: t('login.resetEmailRequired'),
      });
      return;
    }

    try {
      setLoading(true);
      await resetPassword(resetEmail);
      toast({
        title: t('login.resetSent'),
        description: t('login.resetInstructions'),
      });
      setShowResetForm(false);
    } catch (err) {
      toast({
        variant: "destructive",
        title: t('login.resetError'),
        description: error || t('login.genericError'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary cursor-pointer" onClick={() => navigate('/')}>
            <span className="mr-2">⚖️</span>
            IndicLaw
          </h1>
          <p className="text-secondary-foreground-color mt-2">{t('login.subtitle')}</p>
        </div>

        <Card className="w-full shadow-xl border-2 border-secondary/30 overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-primary">
              {showResetForm ? t('login.resetPassword') : t('login.title')}
            </CardTitle>
            <CardDescription className="text-center text-secondary-foreground-color mt-2">
              {showResetForm ? t('login.resetDescription') : t('login.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showResetForm ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="reset-email" className="text-sm font-medium text-primary-text">
                    {t('login.emailLabel')}
                  </label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    value={resetEmail} 
                    onChange={(e) => setResetEmail(e.target.value)} 
                    placeholder={t('login.emailPlaceholder')} 
                    className="w-full h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                  />
                </div>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowResetForm(false)}
                    disabled={loading}
                  >
                    {t('login.backToLogin')}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={loading}
                  >
                    {loading ? t('login.sending') : t('login.sendReset')}
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('login.emailLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder={t('login.emailPlaceholder')}
                              type="email"
                              className="pl-10 h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                            />
                            <svg 
                              height={20} 
                              viewBox="0 0 32 32" 
                              width={20} 
                              xmlns="http://www.w3.org/2000/svg"
                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            >
                              <g id="Layer_3" data-name="Layer 3">
                                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" fill="currentColor" />
                              </g>
                            </svg>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('login.passwordLabel')}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...field}
                              placeholder={t('login.passwordPlaceholder')}
                              type={showPassword ? 'text' : 'password'}
                              className="pl-10 h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                            >
                              {showPassword ? (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 3.5a6.5 6.5 0 00-6.5 6.5c0 1.5.5 2.9 1.4 4.1l-1.4 1.4A8.964 8.964 0 011 10a9 9 0 0118 0c0 2.25-.85 4.3-2.25 5.85l-1.425-1.425A6.478 6.478 0 0018.5 10a6.5 6.5 0 00-6.5-6.5zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm3.5 4.5a4.5 4.5 0 10-3-3.87V14a2 2 0 11-2-2v-.37A4.5 4.5 0 0012 18.5a4.5 4.5 0 003-7.87V10a2 2 0 112 2v.37A4.5 4.5 0 0015.5 14z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 3.5a6.5 6.5 0 00-6.5 6.5c0 1.5.5 2.9 1.4 4.1l-1.4 1.4A8.964 8.964 0 011 10a9 9 0 0118 0c0 2.25-.85 4.3-2.25 5.85l-1.425-1.425A6.478 6.478 0 0018.5 10a6.5 6.5 0 00-6.5-6.5zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm3.5 4.5a4.5 4.5 0 10-3-3.87V14a2 2 0 11-2-2v-.37A4.5 4.5 0 0012 18.5a4.5 4.5 0 003-7.87V10a2 2 0 112 2v.37A4.5 4.5 0 0015.5 14z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                      />
                      <label
                        htmlFor="remember"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {t('login.rememberMe')}
                      </label>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowResetForm(true)} 
                      className="text-sm font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6 bg-primary hover:bg-primary/90 py-6 text-base font-medium shadow-md"
                    disabled={loading}
                  >
                    {loading ? t('login.loggingIn') : t('login.loginButton')}
                  </Button>
                </form>
              </Form>
            )}

            {!showResetForm && (
              <>
                <div className="relative mt-6">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground-color">
                      {t('login.orContinueWith')}
                    </span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full py-6 shadow-sm hover:shadow-md transition-all border-gray-300"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                      <path fill="#FBBB00" d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256
                        c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456
                        C103.821,274.792,107.225,292.797,113.47,309.408z" />
                      <path fill="#518EF8" d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451
                        c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535
                        c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z" />
                      <path fill="#28B446" d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512
                        c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771
                        c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z" />
                      <path fill="#F14336" d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012
                        c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0
                        C318.115,0,375.068,22.126,419.404,58.936z" />
                    </svg>
                    <span className="text-base">{t('login.continueWithGoogle')}</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col pt-6 bg-primary/5">
            {!showResetForm && (
              <p className="text-sm text-center text-secondary-foreground-color">
                {t('login.noAccount')} {' '}
                <Link to="/signup" className="font-semibold text-primary hover:underline">
                  {t('login.createAccount')}
                </Link>
              </p>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
