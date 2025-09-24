import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff } from 'lucide-react';
import { registerUser } from '@/lib/authApi';

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup, googleSignIn, error, setError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const from = location.state?.from?.pathname || '/chatbot';

  useEffect(() => setError(null), [setError]);

  const formSchema = z.object({
    name: z.string().min(2, { message: t('signup.validation.name') }),
    email: z.string().email({ message: t('signup.validation.email') }),
    password: z.string().min(6, { message: t('signup.validation.password') }),
    confirmPassword: z.string().min(6, { message: t('signup.validation.confirmPassword') })
  }).refine(data => data.password === data.confirmPassword, {
    message: t('signup.validation.passwordsMatch'),
    path: ['confirmPassword']
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' }
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Register with MongoDB API instead of Firebase
      const response = await registerUser({
        name: values.name,
        email: values.email,
        password: values.password
      });
      
      if (response.success) {
        // Store the JWT token
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('signupTime', new Date().toISOString());
        
        // Also perform Firebase signup for backward compatibility
        try {
          await signup(values.email, values.password, values.name);
        } catch (firebaseErr) {
          console.warn('Firebase signup failed, but MongoDB registration succeeded:', firebaseErr);
        }
        
        toast({ title: t('signup.success'), description: t('signup.welcome', { name: values.name }) });
        navigate(from, { replace: true });
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (err: any) {
      const errorMsg = {
        'auth/email-already-in-use': t('signup.emailInUse'),
        'auth/invalid-email': t('signup.invalidEmail'),
        'auth/weak-password': t('signup.weakPassword')
      }[err.code] || error || err.message || t('signup.genericError');

      toast({ variant: 'destructive', title: t('signup.error'), description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await googleSignIn();
      navigate(from, { replace: true });
    } catch {
      toast({ variant: 'destructive', title: t('signup.error'), description: error || t('signup.googleError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold cursor-pointer" onClick={() => navigate('/')}>⚖️ IndicLaw</h1>
          <p className="mt-2">{t('signup.subtitle')}</p>
        </div>

        <Card className="w-full border overflow-hidden">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-center">{t('signup.title')}</CardTitle>
          </CardHeader> 

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {['name', 'email', 'password', 'confirmPassword'].map((field, index) => (
                  <FormField
                    key={field}
                    control={form.control}
                    name={field as keyof z.infer<typeof formSchema>}
                    render={({ field: f }) => (
                      <FormItem>
                        <FormLabel>{t(`signup.${field}Label`)}</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              {...f}
                              placeholder={t(`signup.${field}Placeholder`)}
                              type={(field.includes('password') && ((field === 'password' && !showPassword) || (field === 'confirmPassword' && !showConfirmPassword))) ? 'password' : 'text'}
                              className="h-12 border"
                            />
                            {field.includes('password') && (
                              <div
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer"
                                onClick={() => field === 'password' ? setShowPassword(p => !p) : setShowConfirmPassword(p => !p)}
                              >
                                {((field === 'password' && showPassword) || (field === 'confirmPassword' && showConfirmPassword)) ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                <Button type="submit" className="w-full mt-6 bg-black text-white hover:bg-neutral-800 py-3" disabled={loading}>
                  {loading ? t('signup.creating') : t('signup.createButton')}
                </Button>
              </form>
            </Form>

            <div className="relative mt-6">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2">{t('signup.orContinueWith')}</span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                className="w-full py-3 border"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <span className="text-base">{t('signup.continueWithGoogle')}</span>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col pt-6">
            <p className="text-sm text-center">
              {t('signup.alreadyHaveAccount')} <Link to="/login" className="font-semibold underline">{t('signup.login')}</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
