// Modified LoginPage.tsx with Black & White Aesthetic for Light Theme
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

  const from = location.state?.from?.pathname || '/chatbot';

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      form.setValue('email', rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const formSchema = z.object({
    email: z.string().email({ message: t('login.validation.email') }),
    password: z.string().min(6, { message: t('login.validation.password') }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      setError(null);
      await login(values.email, values.password);
      localStorage.setItem('lastLoginTime', new Date().toISOString());
      rememberMe
        ? localStorage.setItem('rememberedEmail', values.email)
        : localStorage.removeItem('rememberedEmail');
      navigate(from, { replace: true });
      toast({ title: t('login.success'), description: t('login.welcome') });
    } catch (err: any) {
      const code = err.code;
      let description =
        code === 'auth/user-not-found' || code === 'auth/wrong-password'
          ? t('login.invalidCredentials')
          : code === 'auth/too-many-requests'
          ? t('login.tooManyAttempts')
          : error || t('login.genericError');
      toast({ variant: 'destructive', title: t('login.error'), description });
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
    } catch (err) {
      toast({ variant: 'destructive', title: t('login.error'), description: error || t('login.googleError') });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      toast({ variant: 'destructive', title: t('login.resetError'), description: t('login.resetEmailRequired') });
      return;
    }
    try {
      setLoading(true);
      await resetPassword(resetEmail);
      toast({ title: t('login.resetSent'), description: t('login.resetInstructions') });
      setShowResetForm(false);
    } catch (err) {
      toast({ variant: 'destructive', title: t('login.resetError'), description: error || t('login.genericError') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-black cursor-pointer" onClick={() => navigate('/')}>⚖️ IndicLaw</h1>
          <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
        </div>

        <Card className="w-full shadow-md border border-black/20 bg-white text-black">
          <CardHeader className="bg-gray-100 pb-6">
            <CardTitle className="text-2xl font-bold text-center">{showResetForm ? t('login.resetPassword') : t('login.title')}</CardTitle>
            <CardDescription className="text-center text-gray-600 mt-2">
              {showResetForm ? t('login.resetDescription') : t('login.description')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showResetForm ? (
              <div className="space-y-4">
                <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')} className="w-full h-12 border-black/30 text-black placeholder:text-gray-500" />
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={() => setShowResetForm(false)} disabled={loading} className="border-black text-black">
                    {t('login.backToLogin')}
                  </Button>
                  <Button type="button" onClick={handleResetPassword} disabled={loading} className="bg-black text-white">
                    {loading ? t('login.sending') : t('login.sendReset')}
                  </Button>
                </div>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.emailLabel')}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t('login.emailPlaceholder')} type="email"
                          className="h-12 border-black/20 text-black placeholder:text-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('login.passwordLabel')}</FormLabel>
                      <FormControl>
                        <Input {...field} type={showPassword ? 'text' : 'password'} placeholder={t('login.passwordPlaceholder')}
                          className="h-12 border-black/20 text-black placeholder:text-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                      <label htmlFor="remember" className="text-sm font-medium text-black">{t('login.rememberMe')}</label>
                    </div>
                    <button type="button" onClick={() => setShowResetForm(true)}
                      className="text-sm font-medium text-black hover:underline">
                      {t('login.forgotPassword')}
                    </button>
                  </div>

                  <Button type="submit" className="w-full mt-6 bg-black hover:bg-gray-800 py-6 text-white font-medium">
                    {loading ? t('login.loggingIn') : t('login.loginButton')}
                  </Button>
                </form>
              </Form>
            )}

            {!showResetForm && (
              <>
                <div className="relative mt-6">
                  <Separator className="w-full border-black/10" />
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">{t('login.orContinueWith')}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Button type="button" variant="outline" className="w-full py-6 border-black text-black hover:bg-black hover:text-white"
                    onClick={handleGoogleSignIn} disabled={loading}>
                    <span className="text-base">{t('login.continueWithGoogle')}</span>
                  </Button>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col pt-6 bg-gray-100">
            {!showResetForm && (
              <p className="text-sm text-center text-black">
                {t('login.noAccount')} {' '}
                <Link to="/signup" className="font-semibold text-black hover:underline">
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
