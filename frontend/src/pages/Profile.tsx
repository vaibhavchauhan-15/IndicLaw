import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Camera, UserRound } from 'lucide-react';

// Form validation schemas
const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  gender: z.string().optional(),
  age: z.string()
    .refine(val => !val || !isNaN(Number(val)), {
      message: 'Age must be a number',
    })
    .optional(),
  dob: z.string().optional(),
});

const emailFormSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  newPassword: z.string().min(6, {
    message: 'New password must be at least 6 characters.',
  }),
  confirmPassword: z.string().min(6, {
    message: 'Confirm password must be at least 6 characters.',
  }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const deleteAccountFormSchema = z.object({
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters.',
  }),
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: 'Please type DELETE to confirm' }),
  }),
});

// Define our form types
type ProfileFormValues = z.infer<typeof profileFormSchema>;
type EmailFormValues = z.infer<typeof emailFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type DeleteAccountFormValues = z.infer<typeof deleteAccountFormSchema>;

const Profile = () => {
  const { 
    currentUser, 
    userProfile, 
    updateUserProfile, 
    updateUserEmail, 
    updateUserPassword, 
    deleteUserAccount, 
    uploadProfilePhoto,
    error,
    setError
  } = useAuth();
  
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Profile Form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || currentUser?.displayName || '',
      gender: userProfile?.gender || '',
      age: userProfile?.age ? String(userProfile.age) : '',
      dob: userProfile?.dob || '',
    },
  });

  // Email Form
  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      email: userProfile?.email || currentUser?.email || '',
      password: '',
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Delete Account Form
  const deleteAccountForm = useForm<DeleteAccountFormValues>({
    resolver: zodResolver(deleteAccountFormSchema),
    defaultValues: {
      password: '',
      confirmation: '' as any, // TypeScript workaround
    },
  });

  // Update profile form values when userProfile changes
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        name: userProfile.name || currentUser?.displayName || '',
        gender: userProfile.gender || '',
        age: userProfile.age ? String(userProfile.age) : '',
        dob: userProfile.dob || '',
      });
    }
  }, [userProfile, currentUser, profileForm]);

  // Clear any errors when component mounts or tab changes
  useEffect(() => {
    if (setError) setError(null);
  }, [activeTab, setError]);

  // Handle profile photo upload
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    uploadProfilePhoto(file, (progress) => {
      setUploadProgress(progress);
    })
      .then(photoURL => {
        toast({
          title: 'Profile photo updated',
          description: 'Your profile photo has been updated successfully.',
        });
      })
      .catch(err => {
        toast({
          title: 'Upload failed',
          description: err.message,
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsUploading(false);
        setUploadProgress(0);
      });
  };

  // Submit handlers for each form
  const onProfileSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        name: data.name,
        gender: data.gender,
        age: data.age ? Number(data.age) : undefined,
        dob: data.dob,
      });
      
      toast({
        title: 'Profile updated',
        description: 'Your profile information has been updated successfully.',
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onEmailSubmit = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      await updateUserEmail(data.email, data.password);
      
      toast({
        title: 'Email updated',
        description: 'Your email has been updated successfully.',
      });
      
      // Reset password field
      emailForm.reset({ email: data.email, password: '' });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      await updateUserPassword(data.currentPassword, data.newPassword);
      
      toast({
        title: 'Password updated',
        description: 'Your password has been updated successfully.',
      });
      
      // Reset form
      passwordForm.reset({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onDeleteAccountSubmit = async (data: DeleteAccountFormValues) => {
    setIsLoading(true);
    try {
      await deleteUserAccount(data.password);
      
      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted successfully.',
      });
      
      // Navigate to home page
      navigate('/');
    } catch (err: any) {
      toast({
        title: 'Delete failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Display initials for avatar fallback
  const getInitials = () => {
    const name = userProfile?.name || currentUser?.displayName || '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Format date if it's in timestamp format
  const formatDate = (date: any): string => {
    if (!date) return 'N/A';
    
    try {
      // Handle Firestore timestamp
      if (date && typeof date === 'object' && date.toDate && typeof date.toDate === 'function') {
        return format(date.toDate(), 'PPP');
      }
      // Handle Date object
      else if (date instanceof Date) {
        return format(date, 'PPP');
      }
      // Handle ISO string
      else if (typeof date === 'string' && date.includes('T')) {
        return format(parseISO(date), 'PPP');
      }
      // Handle other date formats
      else if (typeof date === 'string' && !isNaN(Date.parse(date))) {
        return format(new Date(date), 'PPP');
      }
      return String(date);
    } catch (error) {
      return String(date);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">{t("profile.title")}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Avatar and basic info */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <div className="relative mb-4">
              <Avatar className="w-32 h-32 border-4 border-primary/10">
                <AvatarImage src={currentUser?.photoURL || undefined} />
                <AvatarFallback className="text-2xl">
                  {isUploading ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    getInitials() || <UserRound />
                  )}
                </AvatarFallback>
              </Avatar>
              
              <Button
                variant="outline"
                size="icon"
                className="rounded-full absolute bottom-0 right-0 bg-background"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
            
            {isUploading && (
              <div className="w-full max-w-[200px] mb-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-1">{Math.round(uploadProgress)}%</p>
              </div>
            )}
            
            <CardTitle>{userProfile?.name || currentUser?.displayName}</CardTitle>
            <CardDescription>{userProfile?.email || currentUser?.email}</CardDescription>
          </CardHeader>
          
          <CardContent className="text-sm">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member since:</span>
                <span>{userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'N/A'}</span>
              </div>
              
              {userProfile?.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span>{userProfile.gender}</span>
                </div>
              )}
              
              {userProfile?.age && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age:</span>
                  <span>{userProfile.age}</span>
                </div>
              )}
              
              {userProfile?.dob && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span>{formatDate(userProfile.dob)}</span>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter>
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all of your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <Form {...deleteAccountForm}>
                  <form onSubmit={deleteAccountForm.handleSubmit(onDeleteAccountSubmit)} className="space-y-4">
                    <FormField
                      control={deleteAccountForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={deleteAccountForm.control}
                      name="confirmation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmation</FormLabel>
                          <FormControl>
                            <Input placeholder="Type DELETE to confirm" {...field} />
                          </FormControl>
                          <FormDescription>
                            Type DELETE in all caps to confirm.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction asChild>
                        <Button type="submit" variant="destructive" disabled={isLoading}>
                          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Delete Account
                        </Button>
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </Form>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
        
        {/* Right column - Profile edit forms */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account settings and preferences.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="profile">{t("profile.personalInfo")}</TabsTrigger>
                <TabsTrigger value="email">{t("profile.email")}</TabsTrigger>
                <TabsTrigger value="password">{t("profile.password")}</TabsTrigger>
              </TabsList>
              
              {/* Profile Information Tab */}
              <TabsContent value="profile">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("profile.name")}</FormLabel>
                          <FormControl>
                            <Input placeholder={t("profile.namePlaceholder")} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age</FormLabel>
                            <FormControl>
                              <Input placeholder="Your age" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="dob"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.saveChanges")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Email Tab */}
              <TabsContent value="email">
                <Form {...emailForm}>
                  <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-6">
                    <FormField
                      control={emailForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            This will be used for login and notifications.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={emailForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormDescription>
                            We need your current password to confirm this change.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.updateEmail")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              {/* Password Tab */}
              <TabsContent value="password">
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Current password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="New password" {...field} />
                          </FormControl>
                          <FormDescription>
                            Password must be at least 6 characters.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("profile.saving")}
                        </>
                      ) : (
                        t("profile.changePassword")
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
