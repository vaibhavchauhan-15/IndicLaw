import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, googleSignIn, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // Get redirect path from location state or default to /chatbot
  const from = location.state?.from?.pathname || '/chatbot';

  // Clear any previous errors when component mounts
  useEffect(() => {
    setError(null);
  }, [setError]);

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(2, {
      message: t('signup.validation.name'),
    }),
    email: z.string().email({
      message: t('signup.validation.email'),
    }),
    password: z.string().min(6, {
      message: t('signup.validation.password'),
    }),
    confirmPassword: z.string().min(6, {
      message: t('signup.validation.confirmPassword'),
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('signup.validation.passwordsMatch'),
    path: ['confirmPassword'],
  });

  // Form initialization
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  // Handle signup submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      setFormSubmitted(true);
      
      console.log("Attempting signup with email:", values.email);
      const user = await signup(values.email, values.password, values.name);
      
      // Store signup timestamp in localStorage (optional)
      localStorage.setItem('signupTime', new Date().toISOString());
      
      console.log("Signup successful, navigating to:", from);
      
      toast({
        title: t('signup.success'),
        description: t('signup.welcome', { name: values.name }),
      });
      
      // Make sure user was created successfully before navigating
      if (user) {
        // Ensure navigation happens after successful signup
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 300);
      } else {
        throw new Error("User creation succeeded but no user object was returned");
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      
      // Display specific error messages based on the error code
      if (err.code === 'auth/email-already-in-use') {
        toast({
          variant: "destructive",
          title: t('signup.error'),
          description: t('signup.emailInUse'),
        });
      } else if (err.code === 'auth/invalid-email') {
        toast({
          variant: "destructive",
          title: t('signup.error'),
          description: t('signup.invalidEmail'),
        });
      } else if (err.code === 'auth/weak-password') {
        toast({
          variant: "destructive",
          title: t('signup.error'),
          description: t('signup.weakPassword'),
        });
      } else {
        toast({
          variant: "destructive",
          title: t('signup.error'),
          description: error || err.message || t('signup.genericError'),
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
        title: t('signup.error'),
        description: error || t('signup.googleError'),
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
          <p className="text-secondary-foreground-color mt-2">{t('signup.subtitle')}</p>
        </div>

        <Card className="w-full shadow-xl border-2 border-secondary/30 overflow-hidden">
          <CardHeader className="bg-primary/5 pb-6">
            <CardTitle className="text-2xl font-bold text-center text-primary">
              {t('signup.title')}
            </CardTitle>
            <CardDescription className="text-center text-secondary-foreground-color mt-2">
              {t('signup.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.nameLabel')}</FormLabel>
                      <FormControl>                        <Input
                            {...field}
                            placeholder={t('signup.namePlaceholder')}
                            type="text"
                            className="h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                          />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.emailLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={t('signup.emailPlaceholder')}
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
                      <FormLabel>{t('signup.passwordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={t('signup.passwordPlaceholder')}
                            type={showPassword ? "text" : "password"}
                            className="pl-10 h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                          />
                          <svg 
                            height={20} 
                            viewBox="-64 0 512 512" 
                            width={20} 
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                          >
                            <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" fill="currentColor"/>
                            <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" fill="currentColor"/>
                          </svg>
                          <div 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-slate-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('signup.confirmPasswordLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder={t('signup.confirmPasswordPlaceholder')}
                            type={showConfirmPassword ? "text" : "password"}
                            className="pl-10 h-12 border-gray-300 focus-visible:ring-primary/70 focus-visible:border-primary/70"
                          />
                          <svg 
                            height={20} 
                            viewBox="-64 0 512 512" 
                            width={20} 
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                          >
                            <path d="m336 512h-288c-26.453125 0-48-21.523438-48-48v-224c0-26.476562 21.546875-48 48-48h288c26.453125 0 48 21.523438 48 48v224c0 26.476562-21.546875 48-48 48zm-288-288c-8.8125 0-16 7.167969-16 16v224c0 8.832031 7.1875 16 16 16h288c8.8125 0 16-7.167969 16-16v-224c0-8.832031-7.1875-16-16-16zm0 0" fill="currentColor"/>
                            <path d="m304 224c-8.832031 0-16-7.167969-16-16v-80c0-52.929688-43.070312-96-96-96s-96 43.070312-96 96v80c0 8.832031-7.167969 16-16 16s-16-7.167969-16-16v-80c0-70.59375 57.40625-128 128-128s128 57.40625 128 128v80c0 8.832031-7.167969 16-16 16zm0 0" fill="currentColor"/>
                          </svg>
                          <div 
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-slate-400" />
                            ) : (
                              <Eye className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full mt-6 bg-primary hover:bg-primary/90 py-6 text-base font-medium shadow-md"
                  disabled={loading}
                >
                  {loading ? t('signup.creating') : t('signup.createButton')}
                </Button>
              </form>
            </Form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground-color">
                  {t('signup.orContinueWith')}
                </span>
              </div>
            </div>

            <div className="mt-6">                <Button
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
                <span className="text-base">{t('signup.continueWithGoogle')}</span>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col pt-6 bg-primary/5">
            <p className="text-sm text-center text-secondary-foreground-color">
              {t('signup.alreadyHaveAccount')} {' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                {t('signup.login')}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
